import { ROOM_CONTROL_STYLES, ROOM_CONTROL_CONSTANTS, SLIDER_THUMB_CSS } from './styles/RoomControlsStyles'
import { RoomControls, RoomParams } from './RoomControls'
import { StyleControls, StyleParams } from './StyleControls'
import { GridPatterns } from './patterns/GridPatterns'
import { GridComponent } from './components/GridComponent'

// 윈도우 팔레트 16개 색상 (4x4)
const WINDOWS_PALETTE = [
  '#000000', '#000080', '#008000', '#008080',  // Row 1
  '#800000', '#800080', '#808000', '#C0C0C0',  // Row 2
  '#808080', '#0000FF', '#00FF00', '#00FFFF',  // Row 3  
  '#FF0000', '#FF00FF', '#FFFF00', '#FFFFFF'   // Row 4
]

interface PanelConfig {
  id: string
  title: string
  iconSrc: string
  component: RoomControls | StyleControls
  isOpen: boolean
}

export class ControlsContainer {
  private container: HTMLDivElement | null = null
  private panels: Map<string, PanelConfig> = new Map()
  private roomControls: RoomControls | null = null
  private styleControls: StyleControls | null = null
  private gridComponent: GridComponent | null = null
  
  constructor(
    roomParams: RoomParams,
    styleParams: StyleParams,
    onRoomParamsChange: (params: Partial<RoomParams>) => void,
    onStyleParamsChange: (params: Partial<StyleParams>) => void
  ) {
    this.createContainer()
    this.initializePanels(roomParams, styleParams, onRoomParamsChange, onStyleParamsChange)
  }

  private createContainer(): void {
    this.container = document.createElement('div')
    Object.assign(this.container.style, {
      position: ROOM_CONTROL_STYLES.CONTAINER_BUTTON.position,
      top: ROOM_CONTROL_STYLES.CONTAINER_BUTTON.top,
      right: ROOM_CONTROL_STYLES.CONTAINER_BUTTON.right,
      zIndex: ROOM_CONTROL_STYLES.CONTAINER_BUTTON.zIndex,
      width: ROOM_CONTROL_STYLES.CONTAINER_BUTTON.width,
      fontFamily: ROOM_CONTROL_STYLES.TITLE_TEXT.fontFamily,
      fontSize: ROOM_CONTROL_STYLES.TITLE_TEXT.fontSize
    })
    
    document.body.appendChild(this.container)
  }

  private initializePanels(
    roomParams: RoomParams,
    styleParams: StyleParams,
    onRoomParamsChange: (params: Partial<RoomParams>) => void,
    onStyleParamsChange: (params: Partial<StyleParams>) => void
  ): void {
    // Room Controls 패널 (DOM에 추가하지 않음)
    this.roomControls = new RoomControls(roomParams, onRoomParamsChange, false)
    this.addPanel({
      id: 'room',
      title: 'Room',
      iconSrc: '/icons/room.png',
      component: this.roomControls,
      isOpen: true
    })

    // Style Controls 패널 (DOM에 추가하지 않음)
    this.styleControls = new StyleControls(styleParams, onStyleParamsChange, false)
    this.addPanel({
      id: 'style',
      title: 'Style',
      iconSrc: '/icons/style.png',
      component: this.styleControls,
      isOpen: true
    })
  }

  private addPanel(config: PanelConfig): void {
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

  private extractComponentContent(component: RoomControls | StyleControls): HTMLElement | null {
    // 각 컴포넌트 타입별로 적절한 콘텐츠를 직접 생성
    if (component instanceof StyleControls) {
      return this.createStyleContent(component)
    } else {
      return this.createRoomContent(component as RoomControls)
    }
  }

  private createStyleContent(styleControls: StyleControls): HTMLElement {
    const content = document.createElement('div')
    Object.assign(content.style, {
      backgroundColor: ROOM_CONTROL_STYLES.PANEL_CONTENT.background
    })

    const styleParams = styleControls.getParams()

    // Wall Color 섹션
    const wallColorSection = this.createColorSection('Wall Color', styleParams.wallColor, (color) => {
      // 직접 onParamsChange 콜백 호출
      const onParamsChange = (styleControls as any).onParamsChange
      if (onParamsChange) {
        onParamsChange({ wallColor: color })
      }
    })
    content.appendChild(wallColorSection)

    // Floor Color 섹션  
    const floorColorSection = this.createColorSection('Floor Color', styleParams.floorColor, (color) => {
      // 직접 onParamsChange 콜백 호출
      const onParamsChange = (styleControls as any).onParamsChange
      if (onParamsChange) {
        onParamsChange({ floorColor: color })
      }
    })
    content.appendChild(floorColorSection)

    return content
  }

  private createColorSection(title: string, initialColor: string, onChange: (color: string) => void): HTMLElement {
    // 섹션 컨테이너
    const section = document.createElement('div')
    Object.assign(section.style, ROOM_CONTROL_STYLES.SECTION_CONTAINER)

    // 타이틀
    const titleElement = document.createElement('div')
    titleElement.textContent = title
    Object.assign(titleElement.style, ROOM_CONTROL_STYLES.SECTION_TITLE)
    section.appendChild(titleElement)

    // 현재 선택된 색상 표시 (정사각형)
    const currentColorDisplay = document.createElement('div')
    Object.assign(currentColorDisplay.style, {
      width: '28px',
      height: '28px',
      backgroundColor: initialColor,
      border: '2px solid #000000',
      cursor: 'pointer',
      marginBottom: '4px',
      boxShadow: ROOM_CONTROL_STYLES.BUTTON.boxShadow
    })

    // 컬러 팔레트 (처음에는 숨김)
    const colorPalette = document.createElement('div')
    Object.assign(colorPalette.style, {
      display: 'none',
      position: 'absolute',
      zIndex: '1001',
      backgroundColor: ROOM_CONTROL_STYLES.PANEL_CONTENT.background,
      border: '2px solid #000000',
      padding: '4px',
      gridTemplateColumns: 'repeat(4, 1fr)',
      gridTemplateRows: 'repeat(4, 1fr)',
      gap: '2px',
      width: '120px',
      height: '120px'
    })

    // 4x4 컬러 그리드 생성
    WINDOWS_PALETTE.forEach((color) => {
      const colorCell = document.createElement('div')
      Object.assign(colorCell.style, {
        width: '24px',
        height: '24px',
        backgroundColor: color,
        border: '1px solid #000000',
        cursor: 'pointer',
        boxShadow: 'inset -1px -1px rgba(0, 0, 0, 0.5), inset 1px 1px rgba(255, 255, 255, 0.8)'
      })

      colorCell.addEventListener('click', () => {
        currentColorDisplay.style.backgroundColor = color
        colorPalette.style.display = 'none'
        onChange(color)
      })

      colorCell.addEventListener('mouseenter', () => {
        colorCell.style.boxShadow = 'inset 1px 1px rgba(0, 0, 0, 0.5), inset -1px -1px rgba(255, 255, 255, 0.8)'
      })

      colorCell.addEventListener('mouseleave', () => {
        colorCell.style.boxShadow = 'inset -1px -1px rgba(0, 0, 0, 0.5), inset 1px 1px rgba(255, 255, 255, 0.8)'
      })

      colorPalette.appendChild(colorCell)
    })

    // 팔레트를 body에 붙여서 overflow 문제 해결
    document.body.appendChild(colorPalette)

    // 현재 색상 클릭 시 팔레트 토글
    currentColorDisplay.addEventListener('click', (e) => {
      e.stopPropagation()
      if (colorPalette.style.display === 'none') {
        // 현재 색상 표시 박스의 위치 계산
        const rect = currentColorDisplay.getBoundingClientRect()
        colorPalette.style.left = `${rect.left}px`
        colorPalette.style.top = `${rect.bottom + 4}px`
        colorPalette.style.display = 'grid'
      } else {
        colorPalette.style.display = 'none'
      }
    })

    // 다른 곳 클릭 시 팔레트 닫기
    const closeHandler = () => {
      colorPalette.style.display = 'none'
    }
    document.addEventListener('click', closeHandler)

    colorPalette.addEventListener('click', (e) => {
      e.stopPropagation()
    })

    // 정리 함수 추가 (메모리 누수 방지)
    section.setAttribute('data-cleanup', 'true')
    ;(section as any).cleanup = () => {
      document.removeEventListener('click', closeHandler)
      if (colorPalette.parentNode) {
        document.body.removeChild(colorPalette)
      }
    }

    section.appendChild(currentColorDisplay)
    return section
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
    const section = document.createElement('div')
    Object.assign(section.style, {
      ...ROOM_CONTROL_STYLES.SECTION_CONTAINER,
      ...ROOM_CONTROL_STYLES.SECTION_CONTAINER_FIRST
    })

    // 타이틀
    const titleElement = document.createElement('div')
    titleElement.textContent = 'Walls'
    Object.assign(titleElement.style, ROOM_CONTROL_STYLES.SECTION_TITLE)
    section.appendChild(titleElement)

    // 높이 슬라이더
    const heightSlider = document.createElement('input')
    heightSlider.type = 'range'
    heightSlider.min = '1'
    heightSlider.max = '5'
    heightSlider.step = '1'
    heightSlider.value = currentHeight.toString()
    Object.assign(heightSlider.style, ROOM_CONTROL_STYLES.SLIDER)

    // 슬라이더 핸들 스타일 추가
    this.addSliderThumbStyles()

    heightSlider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value)
      onChange(value)
    })

    section.appendChild(heightSlider)
    return section
  }

  private addSliderThumbStyles(): void {
    if (document.getElementById('slider-thumb-styles')) return
    
    const style = document.createElement('style')
    style.id = 'slider-thumb-styles'
    style.textContent = SLIDER_THUMB_CSS
    document.head.appendChild(style)
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
    const section = document.createElement('div')
    Object.assign(section.style, ROOM_CONTROL_STYLES.SECTION_CONTAINER)

    // 타이틀
    const titleElement = document.createElement('div')
    titleElement.textContent = 'Shapes'
    Object.assign(titleElement.style, ROOM_CONTROL_STYLES.SECTION_TITLE)
    section.appendChild(titleElement)

    // 프리셋 버튼 컨테이너
    const presetsContainer = document.createElement('div')
    Object.assign(presetsContainer.style, ROOM_CONTROL_STYLES.PRESETS_CONTAINER)

    const presets = [
      { icon: 'preA.svg', action: () => this.applyPattern(GridPatterns.createFullPattern(), onChange) },
      { icon: 'preB.svg', action: () => this.applyPattern(GridPatterns.createLPattern(), onChange) },
      { icon: 'preC.svg', action: () => this.applyPattern(GridPatterns.createReverseLPattern(), onChange) },
      { icon: 'PreD.svg', action: () => this.applyPattern(GridPatterns.createTPattern(), onChange) },
      { icon: 'preE.svg', action: () => this.applyPattern(GridPatterns.createCompactCrossPattern(), onChange) }
    ]

    presets.forEach(preset => {
      const button = document.createElement('button')
      Object.assign(button.style, ROOM_CONTROL_STYLES.PRESET_ICON_BUTTON)

      const iconImg = document.createElement('img')
      iconImg.src = `/icons/presets/${preset.icon}`
      Object.assign(iconImg.style, ROOM_CONTROL_STYLES.PRESET_ICON_IMAGE)
      button.appendChild(iconImg)

      button.addEventListener('mouseenter', () => {
        Object.assign(button.style, ROOM_CONTROL_STYLES.PRESET_ICON_BUTTON_HOVER)
      })

      button.addEventListener('mouseleave', () => {
        Object.assign(button.style, ROOM_CONTROL_STYLES.PRESET_ICON_BUTTON)
      })

      button.addEventListener('click', (e) => {
        e.stopPropagation()
        preset.action()
      })

      presetsContainer.appendChild(button)
    })

    section.appendChild(presetsContainer)
    return section
  }

  private applyPattern(pattern: boolean[][], onChange: (grid: boolean[][]) => void): void {
    this.gridComponent?.updateGrid(pattern)
    onChange(pattern)
  }



  private togglePanel(panelId: string): void {
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

  // 공개 메서드들
  public getRoomControls(): RoomControls | null {
    return this.roomControls
  }

  public getStyleControls(): StyleControls | null {
    return this.styleControls
  }

  public updateRoomParams(params: Partial<RoomParams>): void {
    this.roomControls?.updateParams(params)
  }

  public updateStyleParams(params: Partial<StyleParams>): void {
    this.styleControls?.updateParams(params)
  }

  public dispose(): void {
    this.roomControls?.dispose()
    this.styleControls?.dispose()
    this.gridComponent?.dispose()
    
    // 컬러 섹션 정리 함수 호출
    if (this.container) {
      const colorSections = this.container.querySelectorAll('[data-cleanup="true"]')
      colorSections.forEach(section => {
        if ((section as any).cleanup) {
          (section as any).cleanup()
        }
      })
      
      this.container.remove()
      this.container = null
    }
    
    this.panels.clear()
  }
} 