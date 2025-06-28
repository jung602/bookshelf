import { RoomControls } from '../RoomControls'
import { ROOM_CONTROL_STYLES } from '../styles/RoomControlsStyles'
import { GridComponent } from '../components/GridComponent'
import { RangeSlider } from '../components/RangeSlider'
import { PresetButtons } from '../components/PresetButtons'
import { TileCanvas } from '../components/TileCanvas'
import { UIUtils } from '../utils/UIUtils'
import { ToolType } from '../constants/ControlsConstants'

export class RoomContentManager {
  private gridComponent: GridComponent | null = null
  private tileCanvas: TileCanvas | null = null
  private selectedTool: ToolType = 'pen'

  public createContent(roomControls: RoomControls, onStyleParamsChange?: (params: Record<string, unknown>) => void): HTMLElement {
    const content = document.createElement('div')
    Object.assign(content.style, {
      backgroundColor: ROOM_CONTROL_STYLES.PANEL_CONTENT.background
    })

    const roomParams = roomControls.getParams()

    // Walls 섹션
    const wallsSection = this.createWallsSection(roomParams.wallHeight, (height) => {
      const controlsWithParams = roomControls as unknown as { onParamsChange?: (params: Record<string, unknown>) => void }
      if (controlsWithParams.onParamsChange) {
        controlsWithParams.onParamsChange({ wallHeight: height })
      }
    })
    content.appendChild(wallsSection)

    // Floors 섹션 
    const floorsSection = this.createFloorsSection(roomParams.customGrid, (newGrid) => {
      const controlsWithParams = roomControls as unknown as { onParamsChange?: (params: Record<string, unknown>) => void }
      if (controlsWithParams.onParamsChange) {
        controlsWithParams.onParamsChange({ customGrid: newGrid })
      }
    })
    content.appendChild(floorsSection)

    // Shapes 섹션
    const shapesSection = this.createShapesSection((newGrid) => {
      const controlsWithParams = roomControls as unknown as { onParamsChange?: (params: Record<string, unknown>) => void }
      if (controlsWithParams.onParamsChange) {
        controlsWithParams.onParamsChange({ customGrid: newGrid })
      }
    })
    content.appendChild(shapesSection)

    // Style 섹션 (옵션)
    if (onStyleParamsChange) {
      const styleSection = this.createStyleSection(onStyleParamsChange)
      content.appendChild(styleSection)
    }

    return content
  }

  private createWallsSection(currentHeight: number, onChange: (height: number) => void): HTMLElement {
    const rangeSlider = new RangeSlider({
      title: 'Walls',
      min: 1,
      max: 5,
      step: 1,
      initialValue: currentHeight,
      onChange,
      containerStyle: ROOM_CONTROL_STYLES.SECTION_CONTAINER_FIRST
    })
    
    return rangeSlider.create()
  }

  private createFloorsSection(currentGrid: boolean[][], onChange: (grid: boolean[][]) => void): HTMLElement {
    const section = document.createElement('div')
    Object.assign(section.style, ROOM_CONTROL_STYLES.SECTION_CONTAINER)

    // 타이틀
    const titleElement = document.createElement('div')
    titleElement.textContent = 'Floors'
    Object.assign(titleElement.style, ROOM_CONTROL_STYLES.SECTION_TITLE)
    section.appendChild(titleElement)

    // 기존 RoomControls 방식으로 GridComponent 사용
    this.gridComponent = new GridComponent(
      section,
      currentGrid,
      onChange
    )
    
    const gridContainer = this.gridComponent.create()
    section.appendChild(gridContainer)
    
    return section
  }

  private createShapesSection(onChange: (grid: boolean[][]) => void): HTMLElement {
    const config = PresetButtons.createGridPresets(onChange, this.applyPattern.bind(this))
    const presetButtons = new PresetButtons(config)
    return presetButtons.create()
  }

  private createStyleSection(onStyleParamsChange: (params: Record<string, unknown>) => void): HTMLElement {
    const section = document.createElement('div')
    Object.assign(section.style, ROOM_CONTROL_STYLES.SECTION_CONTAINER)

    // 타이틀
    const titleElement = document.createElement('div')
    titleElement.textContent = 'Style'
    Object.assign(titleElement.style, ROOM_CONTROL_STYLES.SECTION_TITLE)
    section.appendChild(titleElement)

    // TileCanvas 초기화
    this.tileCanvas = new TileCanvas({
      selectedTool: this.selectedTool,
      onStyleParamsChange: onStyleParamsChange,
      styleControls: {
        updateParams: (params: Record<string, unknown>) => {
          onStyleParamsChange(params)
        }
      }
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
      initialColor: '#FFFFFF',
      colorType: 'wall',
      onChange: (color) => {
        onStyleParamsChange({ wallColor: color })
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
      initialColor: '#808080',
      colorType: 'floor',
      onChange: (color) => {
        onStyleParamsChange({ floorColor: color })
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

    section.appendChild(mainGrid)
    return section
  }

  private applyPattern(pattern: boolean[][], onChange: (grid: boolean[][]) => void): void {
    this.gridComponent?.updateGrid(pattern)
    onChange(pattern)
  }

  public updateSelectedTool(tool: ToolType): void {
    this.selectedTool = tool
    this.tileCanvas?.updateSelectedTool(tool)
  }

  public dispose(): void {
    this.gridComponent?.dispose()
    this.gridComponent = null
    this.tileCanvas?.dispose()
    this.tileCanvas = null
  }
} 