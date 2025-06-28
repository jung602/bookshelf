import { RoomControls } from '../RoomControls'
import { StyleControls } from '../StyleControls'
import { ROOM_CONTROL_STYLES, ROOM_CONTROL_CONSTANTS } from '../styles/RoomControlsStyles'
import { StyleContentManager } from './StyleContentManager'
import { ToolsContentManager } from './ToolsContentManager'
import { RoomContentManager } from './RoomContentManager'
import { getAssetPath } from '../utils'

// Tools 패널용 더미 타입
type DummyToolsComponent = object

export interface PanelConfig {
  id: string
  title: string
  iconSrc: string
  component: RoomControls | StyleControls | DummyToolsComponent
  isOpen: boolean
}

export type PanelChangeHandler = (params: Record<string, unknown>) => void

export class PanelManager {
  private panels: Map<string, PanelConfig> = new Map()
  private container: HTMLDivElement | null = null
  private onStyleParamsChange: PanelChangeHandler
  private onModelAdd: (modelType: string) => void
  private onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void
  
  // Content Managers
  private styleContentManager: StyleContentManager
  private toolsContentManager: ToolsContentManager
  private roomContentManager: RoomContentManager

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
    
    // Content Managers 초기화
    this.styleContentManager = new StyleContentManager(onStyleParamsChange)
    this.toolsContentManager = new ToolsContentManager(onModelAdd, onBookCreate)
    this.roomContentManager = new RoomContentManager()
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
    
    // Tools 패널의 경우 overflow visible 설정 (드롭다운을 위해)
    if (config.id === 'tools') {
      panelContainer.style.overflow = 'visible'
    }

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
    toggleIcon.src = config.isOpen ? getAssetPath('/icons/Minimize.png') : getAssetPath('/icons/Maximize.svg')
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

  private extractComponentContent(component: RoomControls | StyleControls | DummyToolsComponent): HTMLElement | null {
    // 각 컴포넌트 타입별로 적절한 콘텐츠를 직접 생성
    if (component instanceof StyleControls) {
      return this.styleContentManager.createContent(component)
    } else if (component instanceof RoomControls) {
      return this.roomContentManager.createContent(component)
    } else {
      // Tools 컴포넌트의 경우 (더미 객체)
      return this.toolsContentManager.createContent()
    }
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
      
      // Tools 패널의 경우 overflow visible 유지
      if (panelId === 'tools') {
        panelContainer.style.overflow = 'visible'
      }
      
      // 콘텐츠 나타남
      setTimeout(() => {
        contentContainer.style.opacity = '1'
        contentContainer.style.pointerEvents = 'auto'
      }, ROOM_CONTROL_CONSTANTS.ICON_FADE_DELAY)
      
      if (toggleIcon) toggleIcon.src = getAssetPath('/icons/Minimize.png')
    } else {
      // 패널 닫기 - 기존 RoomControls 방식
      contentContainer.style.opacity = '0'
      contentContainer.style.pointerEvents = 'none'
      
      if (toggleIcon) toggleIcon.src = getAssetPath('/icons/Maximize.svg')
      
      // 패널을 버튼 스타일로 되돌림
      setTimeout(() => {
        Object.assign(panelContainer.style, ROOM_CONTROL_STYLES.CONTAINER_BUTTON)
        // 패널 간 간격 유지
        panelContainer.style.marginBottom = '2px'
        panelContainer.style.position = 'relative'
        
        // Tools 패널의 경우 overflow visible 유지
        if (panelId === 'tools') {
          panelContainer.style.overflow = 'visible'
        }
      }, ROOM_CONTROL_CONSTANTS.CONTENT_HIDE_DELAY)
    }
  }

  public getPanel(panelId: string): PanelConfig | undefined {
    return this.panels.get(panelId)
  }

  public dispose(): void {
    this.styleContentManager?.dispose()
    this.roomContentManager?.dispose()
    this.toolsContentManager?.dispose()
    this.panels.clear()
  }
} 