import { StyleControls } from '../StyleControls'
import { ROOM_CONTROL_STYLES } from '../styles/RoomControlsStyles'
import { TileCanvas } from '../components/TileCanvas'
import { UIUtils } from '../utils/UIUtils'
import { ToolType } from '../constants/ControlsConstants'

export type PanelChangeHandler = (params: Record<string, unknown>) => void

export class StyleContentManager {
  private tileCanvas: TileCanvas | null = null
  private selectedTool: ToolType = 'pen'
  private onStyleParamsChange: PanelChangeHandler

  constructor(onStyleParamsChange: PanelChangeHandler) {
    this.onStyleParamsChange = onStyleParamsChange
  }

  public createContent(styleControls: StyleControls): HTMLElement {
    const content = document.createElement('div')
    Object.assign(content.style, {
      backgroundColor: ROOM_CONTROL_STYLES.PANEL_CONTENT.background,
    })

    const styleParams = styleControls.getParams()

    // TileCanvas 초기화
    this.tileCanvas = new TileCanvas({
      selectedTool: this.selectedTool,
      onStyleParamsChange: this.onStyleParamsChange,
      styleControls: styleControls
    })

    // 5x2 그리드 레이아웃
    const mainGrid = document.createElement('div')
    Object.assign(mainGrid.style, ROOM_CONTROL_STYLES.STYLE_GRID_CONTAINER)

    // 1. 캔버스 (2x2)
    const canvasContainer = this.tileCanvas.create()
    Object.assign(canvasContainer.style, {
      gridColumn: '1 / 3',
      gridRow: '1 / 3'
    })

    // 2. 펜 (1x1)
    const penButton = UIUtils.createToolButton({
      text: 'Pen',
      tool: 'pen',
      selectedTool: this.selectedTool,
      onToolChange: (tool) => {
        this.selectedTool = tool
        this.tileCanvas?.updateSelectedTool(tool)
        UIUtils.updateToolButtons(this.selectedTool)
      }
    })
    Object.assign(penButton.style, {
      gridColumn: '3',
      gridRow: '1'
    })

    // 3. Wall Color (1x1)
    const wallColorSection = UIUtils.createCompactColorSection({
      title: 'Wall',
      initialColor: styleParams.wallColor,
      colorType: 'wall',
      onChange: (color) => {
        const controlsWithParams = styleControls as unknown as { onParamsChange?: (params: Record<string, unknown>) => void }
        if (controlsWithParams.onParamsChange) {
          controlsWithParams.onParamsChange({ wallColor: color })
        }
      }
    })
    Object.assign(wallColorSection.style, {
      gridColumn: '4',
      gridRow: '1'
    })

    // 4. Reset (1x1)
    const resetButton = UIUtils.createActionButton({
      text: 'Reset',
      action: () => this.tileCanvas?.reset()
    })
    Object.assign(resetButton.style, {
      gridColumn: '5',
      gridRow: '1'
    })

    // 5. 지우개 (1x1)
    const eraserButton = UIUtils.createToolButton({
      text: 'Eraser',
      tool: 'eraser',
      selectedTool: this.selectedTool,
      onToolChange: (tool) => {
        this.selectedTool = tool
        this.tileCanvas?.updateSelectedTool(tool)
        UIUtils.updateToolButtons(this.selectedTool)
      }
    })
    Object.assign(eraserButton.style, {
      gridColumn: '3',
      gridRow: '2'
    })

    // 6. Floor Color (1x1)
    const floorColorSection = UIUtils.createCompactColorSection({
      title: 'Floor',
      initialColor: styleParams.floorColor,
      colorType: 'floor',
      onChange: (color) => {
        const controlsWithParams = styleControls as unknown as { onParamsChange?: (params: Record<string, unknown>) => void }
        if (controlsWithParams.onParamsChange) {
          controlsWithParams.onParamsChange({ floorColor: color })
        }
      }
    })
    Object.assign(floorColorSection.style, {
      gridColumn: '4',
      gridRow: '2'
    })

    // 7. Save (1x1)
    const saveButton = UIUtils.createActionButton({
      text: 'Save',
      action: () => this.tileCanvas?.save()
    })
    Object.assign(saveButton.style, {
      gridColumn: '5',
      gridRow: '2'
    })

    // 그리드에 모든 요소 추가
    mainGrid.appendChild(canvasContainer)
    mainGrid.appendChild(penButton)
    mainGrid.appendChild(wallColorSection)
    mainGrid.appendChild(resetButton)
    mainGrid.appendChild(eraserButton)
    mainGrid.appendChild(floorColorSection)
    mainGrid.appendChild(saveButton)

    content.appendChild(mainGrid)
    return content
  }

  public updateSelectedTool(tool: ToolType): void {
    this.selectedTool = tool
    this.tileCanvas?.updateSelectedTool(tool)
  }

  public dispose(): void {
    this.tileCanvas?.dispose()
    this.tileCanvas = null
  }
} 