import { Pane } from 'tweakpane'
import { PixelationParams } from '../passes/RenderPixelatedPass'
import { ColorPalettes } from '../passes/ColorPalettes'

export class PixelationControls {
  private pane: Pane
  private params: PixelationParams
  private onParamsChange: (params: Partial<PixelationParams>) => void

  // 화면 크기에 따른 픽셀 크기 계산
  private static calculatePixelSize(): number {
    const screenWidth = window.innerWidth
    return screenWidth <= 1440 ? 2.5 : 3.5
  }

  // 기본값을 중앙에서 관리 (자동 생성)
  public static getDefaultParams(): PixelationParams {
    const baseParams = {
      pixelSize: PixelationControls.calculatePixelSize(),
      ditherStrength: 0.05,
      ditherScale: 1.0
    }

    // 팔레트 파라미터 자동 추가
    const paletteParams: Record<string, number> = {}
    ColorPalettes.PALETTE_METADATA.forEach(palette => {
      // Windows 16 팔레트는 기본값을 0.3으로 설정
      paletteParams[palette.key] = palette.key === 'useMSPaintPalette' ? 0.3 : 0.0
    })

    return { ...baseParams, ...paletteParams } as PixelationParams
  }

  constructor(
    onParamsChange: (params: Partial<PixelationParams>) => void
  ) {
    const defaultParams = PixelationControls.getDefaultParams()
    this.params = { ...defaultParams }
    this.onParamsChange = onParamsChange

    this.pane = new Pane({
      title: 'Pixelation Controls',
      expanded: true
    })

    this.setupControls()
    this.setupStyles()
    this.setupResizeListener()
    
    // 초기값 즉시 적용
    this.onParamsChange(defaultParams)
  }

  private setupResizeListener() {
    const handleResize = () => {
      const newPixelSize = PixelationControls.calculatePixelSize()
      if (this.params.pixelSize !== newPixelSize) {
        this.params.pixelSize = newPixelSize
        this.onParamsChange({ pixelSize: newPixelSize })
        console.log(`Screen width: ${window.innerWidth}px, Pixel size updated to: ${newPixelSize}`)
      }
    }

    window.addEventListener('resize', handleResize)
    
    // 컴포넌트 정리를 위해 참조 저장
    this.resizeHandler = handleResize
  }

  private resizeHandler?: () => void

  private setupControls() {
    // 디더링 강도
    this.pane.addBinding(this.params, 'ditherStrength', {
      label: 'Dither Strength',
      min: 0,
      max: 0.1,
      step: 0.001
    }).on('change', (ev) => {
      this.onParamsChange({ ditherStrength: ev.value })
    })

    // 디더링 스케일 (패턴 크기)
    this.pane.addBinding(this.params, 'ditherScale', {
      label: 'Dither Scale',
      min: 0.5,
      max: 4.0,
      step: 0.1
    }).on('change', (ev) => {
      this.onParamsChange({ ditherScale: ev.value })
    })

    // 팔레트 컨트롤 자동 생성
    ColorPalettes.PALETTE_METADATA.forEach(palette => {
      this.pane.addBinding(this.params, palette.key as keyof PixelationParams, {
        label: `${palette.emoji} ${palette.name}`,
        min: 0,
        max: 1,
        step: 0.01
      }).on('change', (ev) => {
        this.onParamsChange({ [palette.key]: ev.value })
      })
    })

    // 구분선 추가 (폴더로 대체)
    this.pane.addFolder({
      title: '─────────────',
      expanded: false
    })

    // 리셋 버튼
    this.pane.addButton({
      title: 'Reset to Default'
    }).on('click', () => {
      this.applyPreset(PixelationControls.getDefaultParams())
    })
  }

  private setupStyles() {
    // 컨트롤 패널 스타일링
    const paneElement = this.pane.element
    paneElement.style.position = 'fixed'
    paneElement.style.top = '20px'
    paneElement.style.right = '20px'
    paneElement.style.zIndex = '1000'
    paneElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
    paneElement.style.backdropFilter = 'blur(10px)'
    paneElement.style.borderRadius = '8px'
    paneElement.style.border = '1px solid rgba(255, 255, 255, 0.1)'
  }

  private applyPreset(preset: PixelationParams) {
    // 파라미터 업데이트
    Object.assign(this.params, preset)
    
    // UI 새로고침
    this.pane.refresh()
    
    // 콜백 호출
    this.onParamsChange(preset)
  }

  public updateParams(params: Partial<PixelationParams>) {
    Object.assign(this.params, params)
    this.pane.refresh()
  }

  public getParams(): PixelationParams {
    return { ...this.params }
  }

  public dispose() {
    // 리사이즈 이벤트 리스너 제거
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler)
    }
    this.pane.dispose()
  }
} 