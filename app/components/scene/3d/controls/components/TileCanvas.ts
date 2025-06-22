import { ROOM_CONTROL_STYLES } from '../styles/RoomControlsStyles'
import { TILE_CANVAS_CONFIG, DEFAULT_COLORS, type ToolType } from '../constants/ControlsConstants'

export interface TileCanvasConfig {
  selectedTool: ToolType
  onStyleParamsChange: (params: { wallColor?: string; floorColor?: string }) => void
  styleControls?: { updateParams: (params: Record<string, unknown>) => void }
}

export class TileCanvas {
  private config: TileCanvasConfig
  private tileCanvas: boolean[][] = []
  private container: HTMLElement | null = null

  constructor(config: TileCanvasConfig) {
    this.config = config
    this.initializeTileCanvas()
  }

  private initializeTileCanvas(): void {
    this.tileCanvas = Array(TILE_CANVAS_CONFIG.ROWS).fill(null).map(() => Array(TILE_CANVAS_CONFIG.COLS).fill(false))
  }

  public create(): HTMLElement {
    this.container = document.createElement('div')
    Object.assign(this.container.style, ROOM_CONTROL_STYLES.TILE_CANVAS_CONTAINER)

    for (let row = 0; row < TILE_CANVAS_CONFIG.ROWS; row++) {
      for (let col = 0; col < TILE_CANVAS_CONFIG.COLS; col++) {
        const cell = document.createElement('div')
        Object.assign(cell.style, ROOM_CONTROL_STYLES.TILE_CANVAS_CELL)

        cell.addEventListener('mousedown', () => this.paintCell(row, col, cell))
        cell.addEventListener('mouseenter', (e) => {
          if ((e as MouseEvent).buttons === 1) { // 마우스 버튼이 눌린 상태에서 드래그
            this.paintCell(row, col, cell)
          }
        })

        this.container.appendChild(cell)
      }
    }

    return this.container
  }

  private paintCell(row: number, col: number, cellElement: HTMLElement): void {
    if (this.config.selectedTool === 'pen') {
      this.tileCanvas[row][col] = true
      cellElement.style.backgroundColor = ROOM_CONTROL_STYLES.TILE_CANVAS_CELL_PAINTED.backgroundColor
    } else if (this.config.selectedTool === 'eraser') {
      this.tileCanvas[row][col] = false
      cellElement.style.backgroundColor = ROOM_CONTROL_STYLES.TILE_CANVAS_CELL.backgroundColor
    }
  }

  public updateSelectedTool(tool: ToolType): void {
    this.config.selectedTool = tool
  }

  public reset(): void {
    // 1. 타일 캔버스 초기화
    this.initializeTileCanvas()
    
    // 2. 캔버스 셀들을 다시 흰색으로 초기화
    if (this.container) {
      const canvasCells = this.container.querySelectorAll('div')
      canvasCells.forEach(cell => {
        (cell as HTMLElement).style.backgroundColor = ROOM_CONTROL_STYLES.TILE_CANVAS_CELL.backgroundColor
      })
    }
    
    // 3. 커스텀 텍스처 제거 (기본 체커보드로 되돌리기)
    const resetTextureEvent = new CustomEvent('resetCustomTexture')
    window.dispatchEvent(resetTextureEvent)
    
    // 4. 색상을 기본값으로 초기화 (createWalls.ts, createFloor.ts와 동일한 기본값 사용)
    const defaultWallColor = DEFAULT_COLORS.WALL  // createWalls.ts의 기본값
    const defaultFloorColor = DEFAULT_COLORS.FLOOR // createFloor.ts의 기본값
    
    // Wall Color 섹션의 색상 표시 업데이트
    const wallColorDisplays = document.querySelectorAll('[data-color-type="wall"]')
    wallColorDisplays.forEach(display => {
      (display as HTMLElement).style.backgroundColor = defaultWallColor
    })
    
    // Floor Color 섹션의 색상 표시 업데이트
    const floorColorDisplays = document.querySelectorAll('[data-color-type="floor"]')
    floorColorDisplays.forEach(display => {
      (display as HTMLElement).style.backgroundColor = defaultFloorColor
    })
    
    // 5. 색상 리셋 이벤트 발생시켜 3D 씬에서 실제 색상 업데이트
    const resetColorsEvent = new CustomEvent('resetColors', {
      detail: {
        wallColor: defaultWallColor,
        floorColor: defaultFloorColor
      }
    })
    window.dispatchEvent(resetColorsEvent)
    
    // 6. styleControls를 통해 실제 색상 파라미터 업데이트
    if (this.config.styleControls) {
      this.config.styleControls.updateParams({
        wallColor: defaultWallColor,
        floorColor: defaultFloorColor
      })
    }
    
    // 7. 직접 onStyleParamsChange 콜백 호출하여 3D 씬 업데이트 확실히 하기
    this.config.onStyleParamsChange({
      wallColor: defaultWallColor,
      floorColor: defaultFloorColor
    })
    
    console.log('Canvas, texture, and colors reset to default values')
  }

  public save(): void {
    // 타일 패턴을 Canvas 텍스처로 변환
    const canvas = document.createElement('canvas')
    canvas.width = TILE_CANVAS_CONFIG.TEXTURE_SIZE
    canvas.height = TILE_CANVAS_CONFIG.TEXTURE_SIZE
    const ctx = canvas.getContext('2d')!
    
    // 배경을 흰색으로 설정
    ctx.fillStyle = ROOM_CONTROL_STYLES.TILE_CANVAS_CELL.backgroundColor
    ctx.fillRect(0, 0, TILE_CANVAS_CONFIG.TEXTURE_SIZE, TILE_CANVAS_CONFIG.TEXTURE_SIZE)
    
    // 사용자가 그린 패턴을 그리기 (각 픽셀을 동적 크기로 확대)
    const pixelSize = TILE_CANVAS_CONFIG.TEXTURE_SIZE / TILE_CANVAS_CONFIG.ROWS
    ctx.fillStyle = ROOM_CONTROL_STYLES.TILE_CANVAS_CELL_PAINTED.backgroundColor
    
    for (let row = 0; row < TILE_CANVAS_CONFIG.ROWS; row++) {
      for (let col = 0; col < TILE_CANVAS_CONFIG.COLS; col++) {
        if (this.tileCanvas[row][col]) {
          ctx.fillRect(
            col * pixelSize, 
            row * pixelSize, 
            pixelSize, 
            pixelSize
          )
        }
      }
    }
    
    // Canvas를 데이터 URL로 변환
    const textureDataURL = canvas.toDataURL()
    
    // 3D 씬에 적용하기 위해 이벤트 발생시키기
    const customEvent = new CustomEvent('applyCustomTexture', {
      detail: { textureDataURL }
    })
    window.dispatchEvent(customEvent)
    
    console.log('Tile pattern saved and applied to 3D scene')
  }

  public getCanvasData(): boolean[][] {
    return this.tileCanvas
  }

  public dispose(): void {
    // 이벤트 리스너는 자동으로 정리됨 (DOM 요소와 함께)
    this.container = null
  }
} 