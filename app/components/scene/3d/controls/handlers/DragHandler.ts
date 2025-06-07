import { ROOM_CONTROL_CONSTANTS } from '../styles/RoomControlsStyles'
import { GridPatterns } from '../patterns/GridPatterns'

export class DragHandler {
  private isDragging: boolean = false
  private dragMode: 'paint' | 'erase' | null = null
  private draggedCells: Set<string> = new Set()
  private gridContainer: HTMLDivElement | null = null
  private grid: boolean[][] = []
  private onGridChange: (grid: boolean[][]) => void

  constructor(
    gridContainer: HTMLDivElement,
    initialGrid: boolean[][],
    onGridChange: (grid: boolean[][]) => void
  ) {
    this.gridContainer = gridContainer
    this.grid = initialGrid
    this.onGridChange = onGridChange
    this.setupGlobalEvents()
  }

  private setupGlobalEvents(): void {
    document.addEventListener('mousemove', this.handleGlobalMouseMove)
    document.addEventListener('mouseup', this.handleGlobalMouseUp)
  }

  private handleGlobalMouseMove = (event: MouseEvent): void => {
    if (this.isDragging) {
      const cell = this.getCellFromMouseEvent(event)
      if (cell) {
        this.processDragCell(cell.row, cell.col)
      }
    }
  }

  private handleGlobalMouseUp = (): void => {
    this.endDrag()
  }

  public startDrag(row: number, col: number): void {
    const centerIndex = ROOM_CONTROL_CONSTANTS.CENTER_INDEX
    if (row === centerIndex && col === centerIndex) return

    this.isDragging = true
    this.draggedCells.clear()
    
    this.dragMode = this.grid[row][col] ? 'erase' : 'paint'
    this.processDragCell(row, col)
  }

  private processDragCell(row: number, col: number): void {
    const centerIndex = ROOM_CONTROL_CONSTANTS.CENTER_INDEX
    if (row === centerIndex && col === centerIndex) return

    const cellKey = `${row}-${col}`
    if (this.draggedCells.has(cellKey)) return

    this.draggedCells.add(cellKey)

    if (this.dragMode === 'paint') {
      if (!this.grid[row][col]) {
        const nearestTile = GridPatterns.findNearestActiveTile(this.grid, row, col)
        if (nearestTile) {
          GridPatterns.connectTiles(this.grid, nearestTile.row, nearestTile.col, row, col)
        } else {
          this.grid[row][col] = true
        }
      }
    } else if (this.dragMode === 'erase') {
      this.grid[row][col] = false
    }

    GridPatterns.ensureCenterTile(this.grid)
    this.onGridChange([...this.grid])
  }

  private endDrag(): void {
    if (this.isDragging) {
      this.isDragging = false
      this.dragMode = null
      this.draggedCells.clear()
    }
  }

  private getCellFromMouseEvent(event: MouseEvent): { row: number, col: number } | null {
    if (!this.gridContainer) return null

    const rect = this.gridContainer.getBoundingClientRect()
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    const gap = 2
    const gridSize = ROOM_CONTROL_CONSTANTS.GRID_SIZE
    const availableWidth = rect.width - (gap * (gridSize - 1))
    const availableHeight = rect.height - (gap * (gridSize - 1))
    const cellWidth = availableWidth / gridSize
    const cellHeight = availableHeight / gridSize
    const totalCellWidth = cellWidth + gap
    const totalCellHeight = cellHeight + gap

    const col = Math.floor(x / totalCellWidth)
    const row = Math.floor(y / totalCellHeight)

    if (row >= 0 && row < gridSize && col >= 0 && col < gridSize) {
      return { row, col }
    }

    return null
  }

  public updateGrid(newGrid: boolean[][]): void {
    this.grid = newGrid
  }

  public dispose(): void {
    document.removeEventListener('mousemove', this.handleGlobalMouseMove)
    document.removeEventListener('mouseup', this.handleGlobalMouseUp)
  }
} 