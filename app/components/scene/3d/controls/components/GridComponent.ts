import { ROOM_CONTROL_STYLES, ROOM_CONTROL_CONSTANTS } from '../styles/RoomControlsStyles'
import { DragHandler } from '../handlers/DragHandler'

export class GridComponent {
  private gridContainer: HTMLDivElement | null = null
  private grid: boolean[][]
  private dragHandler: DragHandler | null = null
  private onGridChange: (grid: boolean[][]) => void

  constructor(
    container: HTMLDivElement,
    initialGrid: boolean[][],
    onGridChange: (grid: boolean[][]) => void
  ) {
    this.grid = [...initialGrid]
    this.onGridChange = onGridChange
  }

  public create(): HTMLDivElement {
    this.gridContainer = document.createElement('div')
    Object.assign(this.gridContainer.style, ROOM_CONTROL_STYLES.GRID_CONTAINER)

    this.createCells(this.gridContainer)
    
    // 드래그 핸들러 초기화
    this.dragHandler = new DragHandler(
      this.gridContainer,
      this.grid,
      (newGrid) => {
        this.grid = newGrid
        this.updateVisual()
        this.onGridChange(newGrid)
      }
    )

    return this.gridContainer
  }

  private createCells(gridContainer: HTMLDivElement): void {
    const gridSize = ROOM_CONTROL_CONSTANTS.GRID_SIZE
    const centerIndex = ROOM_CONTROL_CONSTANTS.CENTER_INDEX
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cell = document.createElement('div')
        const isCenterTile = row === centerIndex && col === centerIndex
        
        Object.assign(cell.style, ROOM_CONTROL_STYLES.GRID_CELL)
        
        if (isCenterTile) {
          Object.assign(cell.style, ROOM_CONTROL_STYLES.CENTER_CELL)
          cell.title = '중앙 타일 (항상 활성화)'
        } else {
          this.setupCellEvents(cell, row, col)
        }

        gridContainer.appendChild(cell)
      }
    }
  }

  private setupCellEvents(cell: HTMLDivElement, row: number, col: number): void {
    cell.addEventListener('mousedown', (event) => {
      event.preventDefault()
      this.dragHandler?.startDrag(row, col)
    })

    cell.addEventListener('mouseenter', () => {
      cell.style.transform = 'scale(1.1)'
    })

    cell.addEventListener('mouseleave', () => {
      cell.style.transform = 'scale(1)'
    })

    cell.addEventListener('contextmenu', (event) => {
      event.preventDefault()
    })
  }

  public updateGrid(newGrid: boolean[][]): void {
    this.grid = [...newGrid]
    this.dragHandler?.updateGrid(this.grid)
    this.updateVisual()
  }

  private updateVisual(): void {
    if (!this.gridContainer) return
    
    const gridSize = ROOM_CONTROL_CONSTANTS.GRID_SIZE
    const centerIndex = ROOM_CONTROL_CONSTANTS.CENTER_INDEX
    const cells = this.gridContainer.children
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        const cellIndex = row * gridSize + col
        const cell = cells[cellIndex] as HTMLDivElement
        const isCenterTile = row === centerIndex && col === centerIndex
        
        if (this.grid[row][col]) {
          if (isCenterTile) {
            Object.assign(cell.style, ROOM_CONTROL_STYLES.CENTER_CELL)
          } else {
            Object.assign(cell.style, { 
              ...ROOM_CONTROL_STYLES.GRID_CELL, 
              ...ROOM_CONTROL_STYLES.ACTIVE_CELL 
            })
          }
        } else {
          Object.assign(cell.style, ROOM_CONTROL_STYLES.GRID_CELL)
        }
      }
    }
  }

  public dispose(): void {
    this.dragHandler?.dispose()
  }
} 