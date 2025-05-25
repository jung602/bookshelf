import { Pane } from 'tweakpane'
import { PixelationParams } from '../passes/RenderPixelatedPass'

export class PixelationControls {
  private pane: Pane
  private params: PixelationParams & { enabled: boolean }
  private onParamsChange: (params: Partial<PixelationParams>) => void

  constructor(
    initialParams: PixelationParams,
    onParamsChange: (params: Partial<PixelationParams>) => void
  ) {
    this.params = {
      ...initialParams,
      enabled: true
    }
    this.onParamsChange = onParamsChange

    this.pane = new Pane({
      title: 'Pixelation Controls',
      expanded: true
    })

    this.setupControls()
    this.setupStyles()
  }

  private setupControls() {
    // 픽셀화 활성화/비활성화
    this.pane.addBinding(this.params, 'enabled', {
      label: 'Enable Pixelation'
    }).on('change', (ev) => {
      // 픽셀화 on/off 로직은 SceneManager에서 처리
    })

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

    // 깊이 엣지 강도
    this.pane.addBinding(this.params, 'depthEdgeStrength', {
      label: 'Depth Edge Strength',
      min: 0,
      max: 1,
      step: 0.01
    }).on('change', (ev) => {
      this.onParamsChange({ depthEdgeStrength: ev.value })
    })

    // 구분선 추가 (폴더로 대체)
    this.pane.addFolder({
      title: '─────────────',
      expanded: false
    })

    // 프리셋 버튼들
    const presetFolder = this.pane.addFolder({
      title: 'Presets',
      expanded: false
    })

    presetFolder.addButton({
      title: 'Retro Game'
    }).on('click', () => {
      this.applyPreset({
        pixelSize: 8,
        normalEdgeStrength: 0.5,
        depthEdgeStrength: 0.6
      })
    })

    presetFolder.addButton({
      title: 'Soft Pixel'
    }).on('click', () => {
      this.applyPreset({
        pixelSize: 4,
        normalEdgeStrength: 0.2,
        depthEdgeStrength: 0.3
      })
    })

    presetFolder.addButton({
      title: 'Sharp Edges'
    }).on('click', () => {
      this.applyPreset({
        pixelSize: 6,
        normalEdgeStrength: 0.8,
        depthEdgeStrength: 0.9
      })
    })

    // 리셋 버튼
    this.pane.addButton({
      title: 'Reset to Default'
    }).on('click', () => {
      this.applyPreset({
        pixelSize: 6,
        normalEdgeStrength: 0.3,
        depthEdgeStrength: 0.4
      })
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

  public getParams(): PixelationParams & { enabled: boolean } {
    return { ...this.params }
  }

  public dispose() {
    this.pane.dispose()
  }
} 