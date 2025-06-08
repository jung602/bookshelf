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
    const centerIndex = ROOM_CONTROL_CONSTANTS.CENTER_INDEX
    
    // L자 모양: 왼쪽 위 3x3 블록 + 오른쪽 아래 3x3 블록 (중앙 포함)
    // 왼쪽 위 블록
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        grid[row][col] = true
      }
    }
    
    // 오른쪽 아래 블록 (중앙 타일 포함)
    for (let row = centerIndex; row < centerIndex + 3; row++) {
      for (let col = centerIndex; col < centerIndex + 3; col++) {
        if (row < 5 && col < 5) {
          grid[row][col] = true
        }
      }
    }
    
    return grid
  }

  static createFullPattern(): boolean[][] {
    const gridSize = ROOM_CONTROL_CONSTANTS.GRID_SIZE
    return Array(gridSize).fill(null).map(() => Array(gridSize).fill(true))
  }

  static createReverseLPattern(): boolean[][] {
    const grid = this.createEmptyGrid()
    const centerIndex = ROOM_CONTROL_CONSTANTS.CENTER_INDEX
    
    // 역L자 모양: 오른쪽 위 3x3 블록 + 왼쪽 아래 3x3 블록 (중앙 포함)
    // 오른쪽 위 블록
    for (let row = 0; row < 3; row++) {
      for (let col = centerIndex; col < centerIndex + 3; col++) {
        if (col < 5) {
          grid[row][col] = true
        }
      }
    }
    
    // 왼쪽 아래 블록 (중앙 타일 포함)
    for (let row = centerIndex; row < centerIndex + 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (row < 5) {
          grid[row][col] = true
        }
      }
    }
    
    return grid
  }

  static createTPattern(): boolean[][] {
    const gridSize = ROOM_CONTROL_CONSTANTS.GRID_SIZE
    const centerIndex = ROOM_CONTROL_CONSTANTS.CENTER_INDEX
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false))
    
    // T자 모양: 위쪽 2줄은 전체 활성화, 아래쪽 3줄은 가운데 3개만 활성화
    for (let row = 0; row < gridSize; row++) {
      for (let col = 0; col < gridSize; col++) {
        if (row < 2) {
          // 상단 2줄은 모두 활성화
          grid[row][col] = true
        } else {
          // 하단 3줄은 가운데 3개 컬럼만 활성화 (col: 1, 2, 3)
          if (col >= 1 && col <= 3) {
            grid[row][col] = true
          }
        }
      }
    }
    
    // 중앙 타일은 항상 활성화
    grid[centerIndex][centerIndex] = true
    
    return grid
  }

  static createCompactCrossPattern(): boolean[][] {
    const gridSize = ROOM_CONTROL_CONSTANTS.GRID_SIZE
    const centerIndex = ROOM_CONTROL_CONSTANTS.CENTER_INDEX
    const grid = Array(gridSize).fill(null).map(() => Array(gridSize).fill(false))
    
    // Cross 패턴: 중앙 행 전체와 중앙 열 전체를 활성화
    for (let i = 0; i < gridSize; i++) {
      grid[centerIndex][i] = true  // 중앙 행 전체
      grid[i][centerIndex] = true  // 중앙 열 전체
    }
    
    return grid
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