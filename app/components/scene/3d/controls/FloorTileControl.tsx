'use client'

import { useState } from 'react'

interface FloorTileControlProps {
  initialGrid: boolean[][]
  onGridChange: (grid: boolean[][]) => void
}

export default function FloorTileControl({ initialGrid, onGridChange }: FloorTileControlProps) {
  // 초기값으로만 설정하고 이후 외부 변화에 영향받지 않는 독립적인 상태
  const [grid, setGrid] = useState<boolean[][]>(() => {
    console.log('FloorTileControl: Initializing with grid:', initialGrid)
    return initialGrid.map(row => [...row]) // 깊은 복사
  })

  console.log('FloorTileControl: Current internal grid state:', grid)

  const toggleTile = (row: number, col: number) => {
    console.log(`FloorTileControl: toggleTile called - row: ${row}, col: ${col}`)
    
    // 중앙 타일(2,2)은 항상 활성화 상태 유지
    if (row === 2 && col === 2) {
      console.log('FloorTileControl: Center tile cannot be toggled')
      return
    }
    
    console.log(`FloorTileControl: Current grid[${row}][${col}]:`, grid[row][col])
    
    const newGrid = grid.map((gridRow, r) =>
      gridRow.map((cell, c) => (r === row && c === col ? !cell : cell))
    )
    
    console.log(`FloorTileControl: New grid[${row}][${col}]:`, newGrid[row][col])
    console.log('FloorTileControl: New grid:', newGrid)
    
    setGrid(newGrid)
    onGridChange(newGrid)
    
    console.log('FloorTileControl: onGridChange called with new grid')
  }

  const resetGrid = () => {
    console.log('FloorTileControl: resetGrid called')
    const newGrid = Array(5).fill(null).map(() => Array(5).fill(false))
    newGrid[2][2] = true // 중앙 타일은 항상 활성화
    setGrid(newGrid)
    onGridChange(newGrid)
  }

  const fillAll = () => {
    console.log('FloorTileControl: fillAll called')
    const newGrid = Array(5).fill(null).map(() => Array(5).fill(true))
    setGrid(newGrid)
    onGridChange(newGrid)
  }

  return (
    <div className="p-4 rounded-none w-full h-full">
      
      <div className="space-y-3">
        {/* 그리드 */}
        <div className="w-48 h-48 mx-auto">
          <div className="grid grid-cols-5 bg-custom-white w-full h-full">
            {grid.map((row, rowIndex) =>
              row.map((isActive, colIndex) => {
                return (
                  <button
                    key={`${rowIndex}-${colIndex}`}
                    onClick={() => {
                      console.log(`Button clicked: [${rowIndex}][${colIndex}]`)
                      toggleTile(rowIndex, colIndex)
                    }}
                    className={`
                      w-full h-full aspect-square transition-colors p-0 m-0 border-0
                      ${rowIndex === 2 && colIndex === 2 
                        ? 'bg-custom-gray cursor-not-allowed' 
                        : 'cursor-pointer hover:bg-gray-100'
                      }
                    `}
                    style={
                      rowIndex === 2 && colIndex === 2 
                        ? undefined
                        : {
                            backgroundImage: isActive 
                              ? `linear-gradient(rgba(135, 206, 235, 0.7), rgba(135, 206, 235, 0.7)), url(/ui/BackGrid.svg)`
                              : 'url(/ui/BackGrid.svg)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center'
                          }
                    }
                    disabled={rowIndex === 2 && colIndex === 2}
                    title={rowIndex === 2 && colIndex === 2 ? 'Center Tile (Fixed)' : 'Click to toggle'}
                  >
                  </button>
                )
              })
            )}
          </div>
        </div>
        
        {/* 컨트롤 버튼들 */}
        <div className="flex gap-2">
          <button
            onClick={resetGrid}
            className="flex-1 px-3 py-2 bg-gray-300 text-xs font-w95fa text-black
                       hover:bg-gray-400 transition-colors"
          >
            Reset
          </button>
          <button
            onClick={fillAll}
            className="flex-1 px-3 py-2 bg-gray-300 text-xs font-w95fa text-black
                       hover:bg-gray-400 transition-colors"
          >
            Fill All
          </button>
        </div>
      </div>
    </div>
  )
} 