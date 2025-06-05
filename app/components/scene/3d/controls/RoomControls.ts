import { Pane } from 'tweakpane'

export interface RoomParams {
  width: number
  height: number
  wallHeight: number
  customGrid: boolean[][]  // 5x5 격자 패턴
}

export class RoomControls {
  private pane: Pane
  private params: RoomParams
  private onParamsChange: (params: Partial<RoomParams>) => void
  private gridContainer: HTMLDivElement | null = null

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
    // 커스텀 격자 모드 토글 버튼
    this.pane.addButton({
      title: 'Toggle Custom Floor'
    }).on('click', () => {
      this.toggleCustomGridMode()
    })

    // 방 가로 크기 조절 (격자 모드가 아닐 때만)
    this.pane.addBinding(this.params, 'width', {
      label: 'Room Width',
      min: 1,
      max: 20,
      step: 1,
      disabled: this.isCustomGridActive()
    }).on('change', (ev) => {
      this.onParamsChange({ width: ev.value })
    })

    // 방 세로 크기 조절 (격자 모드가 아닐 때만)
    this.pane.addBinding(this.params, 'height', {
      label: 'Room Height',
      min: 1,
      max: 20,
      step: 1,
      disabled: this.isCustomGridActive()
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

    // 5x5 격자 편집기 추가
    this.createGridEditor()

    // 프리셋 버튼들
    const presetFolder = this.pane.addFolder({
      title: 'Room Presets',
      expanded: false
    })

    presetFolder.addButton({
      title: 'Small Room (3x3)'
    }).on('click', () => {
      this.applyPreset({ width: 3, height: 3, wallHeight: 1, customGrid: this.createEmptyGrid() })
    })

    presetFolder.addButton({
      title: 'Medium Room (5x5)'
    }).on('click', () => {
      this.applyPreset({ width: 5, height: 5, wallHeight: 2, customGrid: this.createEmptyGrid() })
    })

    presetFolder.addButton({
      title: 'Large Room (8x8)'
    }).on('click', () => {
      this.applyPreset({ width: 8, height: 8, wallHeight: 3, customGrid: this.createEmptyGrid() })
    })

    // 격자 프리셋들
    const gridPresetFolder = this.pane.addFolder({
      title: 'Grid Presets',
      expanded: false
    })

    gridPresetFolder.addButton({
      title: 'Cross Shape'
    }).on('click', () => {
      this.applyCrossPattern()
    })

    gridPresetFolder.addButton({
      title: 'L Shape'
    }).on('click', () => {
      this.applyLPattern()
    })

    gridPresetFolder.addButton({
      title: 'Full 5x5'
    }).on('click', () => {
      this.applyFullPattern()
    })

    gridPresetFolder.addButton({
      title: 'Clear Grid'
    }).on('click', () => {
      this.applyClearPattern()
    })

    // 리셋 버튼
    this.pane.addButton({
      title: 'Reset to Default'
    }).on('click', () => {
      this.applyPreset({ width: 5, height: 5, wallHeight: 1, customGrid: this.createEmptyGrid() })
    })
  }

  private createEmptyGrid(): boolean[][] {
    return Array(5).fill(null).map(() => Array(5).fill(false))
  }

  private createGridEditor() {
    const gridFolder = this.pane.addFolder({
      title: '5x5 Floor Designer',
      expanded: true
    })

    // 격자 컨테이너 생성
    this.gridContainer = document.createElement('div')
    this.gridContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(5, 30px);
      grid-template-rows: repeat(5, 30px);
      gap: 2px;
      padding: 10px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 4px;
      margin: 10px 0;
    `

    // 격자 셀들 생성
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const cell = document.createElement('div')
        cell.style.cssText = `
          width: 30px;
          height: 30px;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          cursor: pointer;
          transition: all 0.2s;
        `

        cell.addEventListener('click', () => {
          this.toggleGridCell(row, col, cell)
        })

        cell.addEventListener('mouseenter', () => {
          cell.style.transform = 'scale(1.1)'
        })

        cell.addEventListener('mouseleave', () => {
          cell.style.transform = 'scale(1)'
        })

        this.gridContainer.appendChild(cell)
      }
    }

    // 격자를 pane에 추가
    const gridElement = gridFolder.element.querySelector('.tp-fldv_c')
    if (gridElement) {
      gridElement.appendChild(this.gridContainer)
    }
  }

  private toggleGridCell(row: number, col: number, cellElement: HTMLDivElement) {
    if (!Array.isArray(this.params.customGrid)) {
      this.params.customGrid = this.createEmptyGrid()
    }

    // 셀 상태 토글
    this.params.customGrid[row][col] = !this.params.customGrid[row][col]
    
    // 시각적 업데이트
    if (this.params.customGrid[row][col]) {
      cellElement.style.background = '#ff6b6b'
      cellElement.style.borderColor = '#ff5252'
    } else {
      cellElement.style.background = 'rgba(255, 255, 255, 0.2)'
      cellElement.style.borderColor = 'rgba(255, 255, 255, 0.3)'
    }

    // 변경사항 알림
    this.onParamsChange({ customGrid: this.params.customGrid })
  }

  private showGridEditor() {
    if (this.gridContainer) {
      this.gridContainer.style.display = 'grid'
    }
  }

  private hideGridEditor() {
    if (this.gridContainer) {
      this.gridContainer.style.display = 'none'
    }
  }

  private applyCrossPattern() {
    const grid = this.createEmptyGrid()
    // 십자 패턴 생성
    for (let i = 0; i < 5; i++) {
      grid[2][i] = true  // 가로 중앙
      grid[i][2] = true  // 세로 중앙
    }
    this.params.customGrid = grid
    this.updateGridVisual()
    this.onParamsChange({ customGrid: grid })
  }

  private applyLPattern() {
    const grid = this.createEmptyGrid()
    // L 패턴 생성
    for (let i = 1; i < 4; i++) {
      grid[i][1] = true  // 세로줄
      grid[3][i] = true  // 가로줄
    }
    this.params.customGrid = grid
    this.updateGridVisual()
    this.onParamsChange({ customGrid: grid })
  }

  private applyFullPattern() {
    const grid = Array(5).fill(null).map(() => Array(5).fill(true))
    this.params.customGrid = grid
    this.updateGridVisual()
    this.onParamsChange({ customGrid: grid })
  }

  private applyClearPattern() {
    this.params.customGrid = this.createEmptyGrid()
    this.updateGridVisual()
    this.onParamsChange({ customGrid: this.params.customGrid })
  }

  private updateGridVisual() {
    if (!this.gridContainer || !Array.isArray(this.params.customGrid)) return

    const cells = this.gridContainer.children
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const cellIndex = row * 5 + col
        const cell = cells[cellIndex] as HTMLDivElement
        
        if (this.params.customGrid[row][col]) {
          cell.style.background = '#ff6b6b'
          cell.style.borderColor = '#ff5252'
        } else {
          cell.style.background = 'rgba(255, 255, 255, 0.2)'
          cell.style.borderColor = 'rgba(255, 255, 255, 0.3)'
        }
      }
    }
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

  private applyPreset(preset: Partial<RoomParams>) {
    // 파라미터 업데이트
    Object.assign(this.params, preset)
    
    // UI 새로고침
    this.pane.refresh()
    
    // 격자 시각 업데이트
    if (preset.customGrid) {
      this.updateGridVisual()
    }
    
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

  private toggleCustomGridMode() {
    if (this.isCustomGridActive()) {
      this.hideGridEditor()
    } else {
      this.showGridEditor()
    }
  }

  private isCustomGridActive(): boolean {
    return Array.isArray(this.params.customGrid)
  }
} 