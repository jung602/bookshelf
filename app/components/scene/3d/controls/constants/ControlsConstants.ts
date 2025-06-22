// 윈도우 팔레트 16개 색상 (4x4)
export const WINDOWS_PALETTE = [
  '#000000', '#000080', '#008000', '#008080',  // Row 1
  '#800000', '#800080', '#808000', '#C0C0C0',  // Row 2
  '#808080', '#0000FF', '#00FF00', '#00FFFF',  // Row 3  
  '#FF0000', '#FF00FF', '#FFFF00', '#FFFFFF'   // Row 4
]

// 타일 캔버스 설정
export const TILE_CANVAS_CONFIG = {
  ROWS: 10,
  COLS: 10,
  TEXTURE_SIZE: 64
} as const

// 기본 색상
export const DEFAULT_COLORS = {
  WALL: '#cccccc',
  FLOOR: '#ffffff'
} as const

// 도구 타입
export type ToolType = 'pen' | 'eraser' 