import { Pane } from 'tweakpane'

export interface RoomParams {
  width: number
  height: number
  wallHeight: number
}

export class RoomControls {
  private pane: Pane
  private params: RoomParams
  private onParamsChange: (params: Partial<RoomParams>) => void

  constructor(
    initialParams: RoomParams,
    onParamsChange: (params: Partial<RoomParams>) => void
  ) {
    this.params = { ...initialParams }
    this.onParamsChange = onParamsChange

    this.pane = new Pane({
      title: 'Room Controls',
      expanded: true
    })

    this.setupControls()
    this.setupStyles()
  }

  private setupControls() {
    // 방 가로 크기 조절
    this.pane.addBinding(this.params, 'width', {
      label: 'Room Width',
      min: 1,
      max: 20,
      step: 1
    }).on('change', (ev) => {
      this.onParamsChange({ width: ev.value })
    })

    // 방 세로 크기 조절
    this.pane.addBinding(this.params, 'height', {
      label: 'Room Height',
      min: 1,
      max: 20,
      step: 1
    }).on('change', (ev) => {
      this.onParamsChange({ height: ev.value })
    })

    // 벽 높이 조절
    this.pane.addBinding(this.params, 'wallHeight', {
      label: 'Wall Height',
      min: 1,
      max: 10,
      step: 1
    }).on('change', (ev) => {
      this.onParamsChange({ wallHeight: ev.value })
    })

    // 구분선 추가
    this.pane.addFolder({
      title: '─────────────',
      expanded: false
    })

    // 프리셋 버튼들
    const presetFolder = this.pane.addFolder({
      title: 'Room Presets',
      expanded: false
    })

    presetFolder.addButton({
      title: 'Small Room (3x3)'
    }).on('click', () => {
      this.applyPreset({ width: 3, height: 3, wallHeight: 1 })
    })

    presetFolder.addButton({
      title: 'Medium Room (5x5)'
    }).on('click', () => {
      this.applyPreset({ width: 5, height: 5, wallHeight: 2 })
    })

    presetFolder.addButton({
      title: 'Large Room (8x8)'
    }).on('click', () => {
      this.applyPreset({ width: 8, height: 8, wallHeight: 3 })
    })

    presetFolder.addButton({
      title: 'High Ceiling (5x5)'
    }).on('click', () => {
      this.applyPreset({ width: 5, height: 5, wallHeight: 4 })
    })

    presetFolder.addButton({
      title: 'Low Ceiling (5x5)'
    }).on('click', () => {
      this.applyPreset({ width: 5, height: 5, wallHeight: 1 })
    })

    // 리셋 버튼
    this.pane.addButton({
      title: 'Reset to Default'
    }).on('click', () => {
      this.applyPreset({ width: 5, height: 5, wallHeight: 1 })
    })
  }

  private setupStyles() {
    // 컨트롤 패널 스타일링
    const paneElement = this.pane.element
    paneElement.style.position = 'fixed'
    paneElement.style.top = '20px'
    paneElement.style.left = '20px'
    paneElement.style.zIndex = '1000'
    paneElement.style.backgroundColor = 'rgba(0, 0, 0, 0.8)'
    paneElement.style.backdropFilter = 'blur(10px)'
    paneElement.style.borderRadius = '8px'
    paneElement.style.border = '1px solid rgba(255, 255, 255, 0.1)'
  }

  private applyPreset(preset: RoomParams) {
    // 파라미터 업데이트
    Object.assign(this.params, preset)
    
    // UI 새로고침
    this.pane.refresh()
    
    // 콜백 호출
    this.onParamsChange(preset)
  }

  public updateParams(params: Partial<RoomParams>) {
    Object.assign(this.params, params)
    this.pane.refresh()
  }

  public getParams(): RoomParams {
    return { ...this.params }
  }

  public dispose() {
    this.pane.dispose()
  }
} 