import { RoomControls } from '../RoomControls'
import { StyleControls } from '../StyleControls'
import { ToolsControls } from '../ToolsControls'
import { ROOM_CONTROL_STYLES, ROOM_CONTROL_CONSTANTS } from '../styles/RoomControlsStyles'
import { GridComponent } from '../components/GridComponent'
import { TileCanvas } from '../components/TileCanvas'
import { RangeSlider } from '../components/RangeSlider'
import { PresetButtons } from '../components/PresetButtons'
import { UIUtils } from '../utils/UIUtils'
import { ToolType } from '../constants/ControlsConstants'

export interface PanelConfig {
  id: string
  title: string
  iconSrc: string
  component: RoomControls | StyleControls | ToolsControls
  isOpen: boolean
}

export type PanelChangeHandler = (params: any) => void

export class PanelManager {
  private panels: Map<string, PanelConfig> = new Map()
  private container: HTMLDivElement | null = null
  private gridComponent: GridComponent | null = null
  private tileCanvas: TileCanvas | null = null
  private selectedTool: ToolType = 'pen'
  private onStyleParamsChange: PanelChangeHandler
  private onModelAdd: (modelType: string) => void
  private onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void

  constructor(
    container: HTMLDivElement,
    onStyleParamsChange: PanelChangeHandler,
    onModelAdd: (modelType: string) => void,
    onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void
  ) {
    this.container = container
    this.onStyleParamsChange = onStyleParamsChange
    this.onModelAdd = onModelAdd
    this.onBookCreate = onBookCreate
  }

  public addPanel(config: PanelConfig): void {
    this.panels.set(config.id, config)
    
    // 패널 컨테이너 생성 (기존 RoomControls처럼 전체 컨테이너 스타일 적용)
    const panelContainer = document.createElement('div')
    panelContainer.id = `panel-container-${config.id}`
    
    // 초기 스타일 설정 (열린 상태인지 닫힌 상태인지에 따라)
    if (config.isOpen) {
      Object.assign(panelContainer.style, ROOM_CONTROL_STYLES.CONTAINER_PANEL)
    } else {
      Object.assign(panelContainer.style, ROOM_CONTROL_STYLES.CONTAINER_BUTTON)
    }
    
    // 마진 추가 (패널 간 간격) - 최소한의 하드코딩 유지
    panelContainer.style.marginBottom = '2px'
    panelContainer.style.position = 'relative'

    // 헤더 생성
    const header = this.createPanelHeader(config)
    panelContainer.appendChild(header)

    // 콘텐츠 컨테이너 생성 
    const contentContainer = document.createElement('div')
    contentContainer.id = `panel-content-${config.id}`
    Object.assign(contentContainer.style, {
      ...ROOM_CONTROL_STYLES.PANEL_CONTENT,
      opacity: config.isOpen ? '1' : '0',
      pointerEvents: config.isOpen ? 'auto' : 'none'
    })

    // 컴포넌트의 실제 콘텐츠를 가져와서 추가
    const componentContent = this.extractComponentContent(config.component)
    if (componentContent) {
      contentContainer.appendChild(componentContent)
    }

    panelContainer.appendChild(contentContainer)
    
    if (this.container) {
      this.container.appendChild(panelContainer)
    }
  }

  private createPanelHeader(config: PanelConfig): HTMLElement {
    const header = document.createElement('div')
    Object.assign(header.style, ROOM_CONTROL_STYLES.HEADER_CONTAINER)

    // 왼쪽 부분 (아이콘 + 제목)
    const leftSection = document.createElement('div')
    Object.assign(leftSection.style, ROOM_CONTROL_STYLES.HEADER_LEFT)

    // 아이콘
    const iconContainer = document.createElement('div')
    Object.assign(iconContainer.style, ROOM_CONTROL_STYLES.BUTTON_ICON)

    const icon = document.createElement('img')
    icon.src = config.iconSrc
    Object.assign(icon.style, ROOM_CONTROL_STYLES.BUTTON_ICON_IMAGE)
    iconContainer.appendChild(icon)

    // 제목
    const title = document.createElement('div')
    title.textContent = config.title
    Object.assign(title.style, ROOM_CONTROL_STYLES.TITLE_TEXT)

    leftSection.appendChild(iconContainer)
    leftSection.appendChild(title)

    // 오른쪽 부분 (토글 버튼)
    const toggleButton = document.createElement('div')
    Object.assign(toggleButton.style, ROOM_CONTROL_STYLES.CLOSE_BUTTON)

    const toggleIcon = document.createElement('img')
    toggleIcon.src = config.isOpen ? '/icons/Minimize.png' : '/icons/Maximize.svg'
    Object.assign(toggleIcon.style, ROOM_CONTROL_STYLES.CLOSE_BUTTON_IMAGE)
    toggleButton.appendChild(toggleIcon)

    // 클릭 이벤트
    header.addEventListener('click', (e) => {
      e.stopPropagation()
      this.togglePanel(config.id)
    })

    // 호버 이벤트
    toggleButton.addEventListener('mouseenter', () => {
      Object.assign(toggleButton.style, ROOM_CONTROL_STYLES.CLOSE_BUTTON_HOVER)
    })

    toggleButton.addEventListener('mouseleave', () => {
      Object.assign(toggleButton.style, ROOM_CONTROL_STYLES.CLOSE_BUTTON)
    })

    header.appendChild(leftSection)
    header.appendChild(toggleButton)

    return header
  }

  private extractComponentContent(component: RoomControls | StyleControls | ToolsControls): HTMLElement | null {
    // 각 컴포넌트 타입별로 적절한 콘텐츠를 직접 생성
    if (component instanceof StyleControls) {
      return this.createStyleContent(component)
    } else if (component instanceof ToolsControls) {
      return this.createToolsContent(component)
    } else {
      return this.createRoomContent(component as RoomControls)
    }
  }

  private createStyleContent(styleControls: StyleControls): HTMLElement {
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
        const onParamsChange = (styleControls as any).onParamsChange
        if (onParamsChange) {
          onParamsChange({ wallColor: color })
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
        const onParamsChange = (styleControls as any).onParamsChange
        if (onParamsChange) {
          onParamsChange({ floorColor: color })
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

  private createToolsContent(toolsControls: ToolsControls): HTMLElement {
    const content = document.createElement('div')
    Object.assign(content.style, {
      backgroundColor: ROOM_CONTROL_STYLES.PANEL_CONTENT.background,
    })

    // Tools 컨테이너 생성 및 설정
    const toolsContainer = toolsControls.getContainer()
    if (toolsContainer) {
      // 기존 스타일을 제거하고 패널 내부 스타일 적용
      toolsContainer.style.position = 'static'
      toolsContainer.style.padding = '0'
      toolsContainer.style.backgroundColor = 'transparent'
      toolsContainer.style.border = 'none'
      
      content.appendChild(toolsContainer)
    }

    return content
  }

  private createRoomContent(roomControls: RoomControls): HTMLElement {
    const content = document.createElement('div')
    Object.assign(content.style, {
      backgroundColor: ROOM_CONTROL_STYLES.PANEL_CONTENT.background
    })

    const roomParams = roomControls.getParams()

    // Walls 섹션
    const wallsSection = this.createWallsSection(roomParams.wallHeight, (height) => {
      const onParamsChange = (roomControls as any).onParamsChange
      if (onParamsChange) {
        onParamsChange({ wallHeight: height })
      }
    })
    content.appendChild(wallsSection)

    // Floors 섹션 
    const floorsSection = this.createFloorsSection(roomParams.customGrid, (newGrid) => {
      const onParamsChange = (roomControls as any).onParamsChange
      if (onParamsChange) {
        onParamsChange({ customGrid: newGrid })
      }
    })
    content.appendChild(floorsSection)

    // Shapes 섹션
    const shapesSection = this.createShapesSection((newGrid) => {
      const onParamsChange = (roomControls as any).onParamsChange
      if (onParamsChange) {
        onParamsChange({ customGrid: newGrid })
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

  public togglePanel(panelId: string): void {
    const panel = this.panels.get(panelId)
    if (!panel) return

    const panelContainer = document.getElementById(`panel-container-${panelId}`)
    const contentContainer = document.getElementById(`panel-content-${panelId}`)
    if (!panelContainer || !contentContainer) return

    panel.isOpen = !panel.isOpen

    // 토글 아이콘 업데이트
    const toggleIcon = panelContainer.querySelector('img[src*="Maximize"], img[src*="Minimize"]') as HTMLImageElement
    
    if (panel.isOpen) {
      // 패널 열기 - 기존 RoomControls 방식
      Object.assign(panelContainer.style, ROOM_CONTROL_STYLES.CONTAINER_PANEL)
      // 패널 간 간격 유지
      panelContainer.style.marginBottom = '2px'
      panelContainer.style.position = 'relative'
      
      // 콘텐츠 나타남
      setTimeout(() => {
        contentContainer.style.opacity = '1'
        contentContainer.style.pointerEvents = 'auto'
      }, ROOM_CONTROL_CONSTANTS.ICON_FADE_DELAY)
      
      if (toggleIcon) toggleIcon.src = '/icons/Minimize.png'
    } else {
      // 패널 닫기 - 기존 RoomControls 방식
      contentContainer.style.opacity = '0'
      contentContainer.style.pointerEvents = 'none'
      
      if (toggleIcon) toggleIcon.src = '/icons/Maximize.svg'
      
      // 패널을 버튼 스타일로 되돌림
      setTimeout(() => {
        Object.assign(panelContainer.style, ROOM_CONTROL_STYLES.CONTAINER_BUTTON)
        // 패널 간 간격 유지
        panelContainer.style.marginBottom = '2px'
        panelContainer.style.position = 'relative'
      }, ROOM_CONTROL_CONSTANTS.CONTENT_HIDE_DELAY)
    }
  }

  public getPanel(panelId: string): PanelConfig | undefined {
    return this.panels.get(panelId)
  }

  public updateSelectedTool(tool: ToolType): void {
    this.selectedTool = tool
  }

  public dispose(): void {
    this.gridComponent?.dispose()
    this.tileCanvas?.dispose()
    this.panels.clear()
  }
} 