import { Pane } from 'tweakpane'
import { PixelationParams } from '../passes/RenderPixelatedPass'

export class PixelationControls {
  private pane: Pane
  private params: PixelationParams
  private onParamsChange: (params: Partial<PixelationParams>) => void

  // 기본값을 중앙에서 관리
  public static getDefaultParams(): PixelationParams {
    return {
      pixelSize: 3,
      normalEdgeStrength: 0.20,
      innerEdgeSensitivity: 0.02,
      edgeThreshold: 0.01
    }
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
    
    // 초기값 즉시 적용
    this.onParamsChange(defaultParams)
  }

  private setupControls() {
    // 픽셀 크기 조절
    this.pane.addBinding(this.params, 'pixelSize', {
      label: 'Pixel Size',
      min: 1,
      max: 20,
      step: 1
    }).on('change', (ev) => {
      this.onParamsChange({ pixelSize: ev.value })
    })

    // 노멀 엣지 강도
    this.pane.addBinding(this.params, 'normalEdgeStrength', {
      label: 'Normal Edge Strength',
      min: 0,
      max: 1,
      step: 0.01
    }).on('change', (ev) => {
      this.onParamsChange({ normalEdgeStrength: ev.value })
    })

    // Inner Edge 민감도
    this.pane.addBinding(this.params, 'innerEdgeSensitivity', {
      label: 'Inner Edge Sensitivity',
      min: 0,
      max: 2,
      step: 0.01
    }).on('change', (ev) => {
      this.onParamsChange({ innerEdgeSensitivity: ev.value })
    })

    // Edge 임계값
    this.pane.addBinding(this.params, 'edgeThreshold', {
      label: 'Edge Threshold',
      min: 0.001,
      max: 0.1,
      step: 0.001
    }).on('change', (ev) => {
      this.onParamsChange({ edgeThreshold: ev.value })
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
    this.pane.dispose()
  }
} 