import { RoomControls } from '../RoomControls'
import { ROOM_CONTROL_STYLES } from '../styles/RoomControlsStyles'
import { GridComponent } from '../components/GridComponent'
import { RangeSlider } from '../components/RangeSlider'
import { PresetButtons } from '../components/PresetButtons'

export class RoomContentManager {
  private gridComponent: GridComponent | null = null

  public createContent(roomControls: RoomControls): HTMLElement {
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

  private applyPattern(pattern: boolean[][], onChange: (grid: boolean[][]) => void): void {
    this.gridComponent?.updateGrid(pattern)
    onChange(pattern)
  }

  public dispose(): void {
    this.gridComponent?.dispose()
    this.gridComponent = null
  }
} 