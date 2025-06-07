import { ROOM_CONTROL_CONSTANTS } from '../styles/RoomControlsStyles'

export class GridPatterns {
  
  static createEmptyGrid(): boolean[][] {
    const gridSize = ROOM_CONTROL_CONSTANTS.GRID_SIZE
    const centerIndex = ROOM_CONTROL_CONSTANTS.CENTER_INDEX
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false))
    grid[centerIndex][centerIndex] = true
    return grid
  }

  static ensureCenterTile(grid: boolean[][]): void {
    if (!Array.isArray(grid)) return
    const centerIndex = ROOM_CONTROL_CONSTANTS.CENTER_INDEX
    grid[centerIndex][centerIndex] = true
  }

  static createCrossPattern(): boolean[][] {
    const grid = this.createEmptyGrid()
    const gridSize = ROOM_CONTROL_CONSTANTS.GRID_SIZE
    const centerIndex = ROOM_CONTROL_CONSTANTS.CENTER_INDEX
    
    for (let i = 0; i < gridSize; i++) {
      grid[centerIndex][i] = true
      grid[i][centerIndex] = true
    }
    
    return grid
  }

  static createLPattern(): boolean[][] {
    const grid = this.createEmptyGrid()
    const gridSize = ROOM_CONTROL_CONSTANTS.GRID_SIZE
    const centerIndex = ROOM_CONTROL_CONSTANTS.CENTER_INDEX
    
    for (let i = centerIndex; i < gridSize; i++) {
      grid[i][centerIndex] = true
      grid[centerIndex][i] = true
    }
    
    return grid
  }

  static createFullPattern(): boolean[][] {
    const gridSize = ROOM_CONTROL_CONSTANTS.GRID_SIZE
    return Array(gridSize).fill(null).map(() => Array(gridSize).fill(true))
  }

  static findNearestActiveTile(grid: boolean[][], targetRow: number, targetCol: number): { row: number, col: number } | null {
    const gridSize = ROOM_CONTROL_CONSTANTS.GRID_SIZE
    let minDistance = Infinity
    let nearestTile = null
    
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (grid[row][col]) {
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

  static connectTiles(grid: boolean[][], startRow: number, startCol: number, endRow: number, endCol: number): void {
    let currentRow = startRow
    let currentCol = startCol
    
    while (currentRow !== endRow || currentCol !== endCol) {
      grid[currentRow][currentCol] = true
      
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
    
    grid[endRow][endCol] = true
  }
} 