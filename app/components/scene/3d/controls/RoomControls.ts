import { Pane } from 'tweakpane'

export interface RoomParams {
  wallHeight: number
  customGrid: boolean[][]  // 5x5 격자 패턴
}

export class RoomControls {
  private pane: Pane
  private params: RoomParams
  private onParamsChange: (params: Partial<RoomParams>) => void
  private gridContainer: HTMLDivElement | null = null
  
  // 드래그 상태 관리
  private isDragging: boolean = false
  private dragMode: 'paint' | 'erase' | null = null
  private draggedCells: Set<string> = new Set() // 이미 드래그된 셀들 추적
  private cleanupEventListeners?: () => void // 이벤트 리스너 정리 함수

  constructor(
    initialParams: RoomParams,
    onParamsChange: (params: Partial<RoomParams>) => void
  ) {
    this.params = { ...initialParams }
    // 중앙 타일은 항상 활성화
    this.ensureCenterTile()
    this.onParamsChange = onParamsChange

    this.pane = new Pane({
      title: 'Floor Designer',
      expanded: true
    })

    this.setupControls()
    this.setupStyles()
  }

  // 중앙 타일 (2, 2)를 항상 활성화 상태로 유지
  private ensureCenterTile(): void {
    if (!Array.isArray(this.params.customGrid)) {
      this.params.customGrid = this.createEmptyGrid()
    }
    
    // 중앙 타일 (2, 2)는 항상 true
    this.params.customGrid[2][2] = true
  }

  // 두 점 사이의 최단 경로를 찾아서 모든 중간 타일을 활성화
  private connectTiles(startRow: number, startCol: number, endRow: number, endCol: number): void {
    const grid = this.params.customGrid
    
    // 시작점에서 끝점까지의 직선 경로 생성 (Manhattan path)
    let currentRow = startRow
    let currentCol = startCol
    
    while (currentRow !== endRow || currentCol !== endCol) {
      // 현재 위치 활성화
      grid[currentRow][currentCol] = true
      
      // 목표 지점으로 한 칸씩 이동
      if (currentRow < endRow) {
        currentRow++
      } else if (currentRow > endRow) {
        currentRow--
      } else if (currentCol < endCol) {
        currentCol++
      } else if (currentCol > endCol) {
        currentCol--
      }
    }
    
    // 마지막 목표 지점도 활성화
    grid[endRow][endCol] = true
  }

  // 가장 가까운 활성화된 타일 찾기
  private findNearestActiveTile(targetRow: number, targetCol: number): { row: number, col: number } | null {
    const grid = this.params.customGrid
    let minDistance = Infinity
    let nearestTile = null
    
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (grid[row][col]) {
          // Manhattan distance 계산
          const distance = Math.abs(targetRow - row) + Math.abs(targetCol - col)
          if (distance < minDistance) {
            minDistance = distance
            nearestTile = { row, col }
          }
        }
      }
    }
    
    return nearestTile
  }

  // 드래그 시작
  private startDrag(row: number, col: number): void {
    // 중앙 타일은 드래그 불가
    if (row === 2 && col === 2) {
      return
    }

    this.isDragging = true
    this.draggedCells.clear()
    
    const grid = this.params.customGrid
    // 현재 셀의 상태에 따라 드래그 모드 결정
    this.dragMode = grid[row][col] ? 'erase' : 'paint'
    
    // 첫 번째 셀 처리
    this.processDragCell(row, col)
  }

  // 드래그 중 셀 처리
  private processDragCell(row: number, col: number): void {
    // 중앙 타일은 처리하지 않음
    if (row === 2 && col === 2) {
      return
    }

    const cellKey = `${row}-${col}`
    
    // 이미 드래그한 셀은 건너뜀
    if (this.draggedCells.has(cellKey)) {
      return
    }

    this.draggedCells.add(cellKey)
    const grid = this.params.customGrid

    if (this.dragMode === 'paint') {
      // 페인트 모드: 타일 활성화 및 연결
      if (!grid[row][col]) {
        const nearestTile = this.findNearestActiveTile(row, col)
        if (nearestTile) {
          this.connectTiles(nearestTile.row, nearestTile.col, row, col)
        } else {
          grid[row][col] = true
        }
      }
    } else if (this.dragMode === 'erase') {
      // 지우기 모드: 타일 비활성화
      grid[row][col] = false
    }

    // 중앙 타일은 항상 유지
    this.ensureCenterTile()
    
    // 시각적 업데이트
    this.updateGridVisual()
  }

  // 드래그 종료
  private endDrag(): void {
    if (this.isDragging) {
      this.isDragging = false
      this.dragMode = null
      this.draggedCells.clear()
      
      // 최종 변경사항 알림
      this.onParamsChange({ customGrid: this.params.customGrid })
    }
  }

  // 마우스 위치에서 셀 좌표 계산
  private getCellFromMouseEvent(event: MouseEvent): { row: number, col: number } | null {
    if (!this.gridContainer) return null

    const rect = this.gridContainer.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // 패딩과 간격을 고려한 셀 크기 계산
    const padding = 10
    const gap = 2
    const cellSize = 30
    const totalCellWidth = cellSize + gap
    const totalCellHeight = cellSize + gap

    const col = Math.floor((x - padding) / totalCellWidth)
    const row = Math.floor((y - padding) / totalCellHeight)

    // 유효한 범위 내에 있는지 확인
    if (row >= 0 && row < 5 && col >= 0 && col < 5) {
      return { row, col }
    }

    return null
  }

  private setupControls() {
    // 안내 메시지
    const infoFolder = this.pane.addFolder({
      title: 'ℹ️ 사용 방법',
      expanded: false
    })
    
    const infoElement = document.createElement('div')
    infoElement.style.cssText = `
      padding: 10px;
      font-size: 12px;
      color: rgba(255, 255, 255, 0.8);
      line-height: 1.4;
    `
    infoElement.textContent = '격자를 클릭하여 바닥을 생성하세요. 중앙 타일은 항상 유지되며, 새로운 타일은 자동으로 기존 타일과 연결됩니다.'
    
    const infoContainer = infoFolder.element.querySelector('.tp-fldv_c')
    if (infoContainer) {
      infoContainer.appendChild(infoElement)
    }

    // 벽 높이 조절
    this.pane.addBinding(this.params, 'wallHeight', {
      label: 'Wall Height',
      min: 1,
      max: 10,
      step: 1
    }).on('change', (ev) => {
      this.onParamsChange({ wallHeight: ev.value })
    })

    // 5x5 격자 편집기 추가
    this.createGridEditor()

    // 격자 프리셋들
    const gridPresetFolder = this.pane.addFolder({
      title: 'Floor Presets',
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
      title: 'Reset to Center'
    }).on('click', () => {
      this.resetToCenter()
    })

    // 바닥 생성/제거 버튼
    this.pane.addButton({
      title: 'Apply Floor Design'
    }).on('click', () => {
      this.onParamsChange({ customGrid: this.params.customGrid })
    })
  }

  private createEmptyGrid(): boolean[][] {
    const grid = Array(5).fill(null).map(() => Array(5).fill(false))
    grid[2][2] = true // 중앙은 항상 true
    return grid
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
      user-select: none;
    `

    // 전역 마우스 이벤트 리스너 추가
    const handleGlobalMouseMove = (event: MouseEvent) => {
      if (this.isDragging) {
        const cell = this.getCellFromMouseEvent(event)
        if (cell) {
          this.processDragCell(cell.row, cell.col)
        }
      }
    }

    const handleGlobalMouseUp = () => {
      this.endDrag()
    }

    // 전역 이벤트 리스너 등록
    document.addEventListener('mousemove', handleGlobalMouseMove)
    document.addEventListener('mouseup', handleGlobalMouseUp)

    // 격자 셀들 생성
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        const cell = document.createElement('div')
        const isCenterTile = row === 2 && col === 2
        
        cell.style.cssText = `
          width: 30px;
          height: 30px;
          background: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.3);
          border-radius: 2px;
          cursor: ${isCenterTile ? 'not-allowed' : 'pointer'};
          transition: all 0.2s;
          ${isCenterTile ? 'opacity: 0.7;' : ''}
        `

        if (!isCenterTile) {
          // 마우스 다운: 드래그 시작
          cell.addEventListener('mousedown', (event) => {
            event.preventDefault()
            this.startDrag(row, col)
          })

          // 마우스 엔터: 드래그 중이면 셀 처리
          cell.addEventListener('mouseenter', () => {
            if (this.isDragging) {
              this.processDragCell(row, col)
            } else {
              // 드래그 중이 아닐 때만 호버 효과
              cell.style.transform = 'scale(1.1)'
            }
          })

          cell.addEventListener('mouseleave', () => {
            if (!this.isDragging) {
              cell.style.transform = 'scale(1)'
            }
          })

          // 우클릭 방지
          cell.addEventListener('contextmenu', (event) => {
            event.preventDefault()
          })
        } else {
          // 중앙 타일에는 특별한 표시 추가
          cell.title = '중앙 타일 (항상 활성화)'
        }

        this.gridContainer.appendChild(cell)
      }
    }

    // 격자를 pane에 추가
    const gridElement = gridFolder.element.querySelector('.tp-fldv_c')
    if (gridElement) {
      gridElement.appendChild(this.gridContainer)
    }

    // 초기 격자 상태 업데이트
    this.updateGridVisual()

    // cleanup 함수를 저장하여 나중에 제거할 수 있도록 함
    this.cleanupEventListeners = () => {
      document.removeEventListener('mousemove', handleGlobalMouseMove)
      document.removeEventListener('mouseup', handleGlobalMouseUp)
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
    // L 패턴 생성 (중앙에서 시작)
    for (let i = 2; i < 5; i++) {
      grid[i][2] = true  // 세로줄 (중앙에서 아래로)
      grid[2][i] = true  // 가로줄 (중앙에서 오른쪽으로)
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

  private resetToCenter() {
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
        const isCenterTile = row === 2 && col === 2
        
        if (this.params.customGrid[row][col]) {
          if (isCenterTile) {
            // 중앙 타일은 특별한 색상
            cell.style.background = '#4CAF50'
            cell.style.borderColor = '#45a049'
          } else {
            cell.style.background = '#ff6b6b'
            cell.style.borderColor = '#ff5252'
          }
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

  public updateParams(params: Partial<RoomParams>) {
    Object.assign(this.params, params)
    this.pane.refresh()
    if (params.customGrid) {
      this.updateGridVisual()
    }
  }

  public getParams(): RoomParams {
    return { ...this.params }
  }

  public dispose() {
    // 이벤트 리스너 정리
    if (this.cleanupEventListeners) {
      this.cleanupEventListeners()
    }
    
    this.pane.dispose()
  }
} 