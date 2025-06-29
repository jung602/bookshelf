import { RoomControls } from '../RoomControls'
import { StyleControls } from '../StyleControls'
import { ROOM_CONTROL_STYLES } from '../styles/RoomControlsStyles'
import { StyleContentManager } from './StyleContentManager'
import { ToolsContentManager } from './ToolsContentManager'
import { RoomContentManager } from './RoomContentManager'
import { BaseModel } from '../../objects/BaseModel'
import { StyleParams, RoomState } from '../ControlsContainer'

// Tools 패널용 더미 타입
type DummyToolsComponent = object

export interface PanelConfig {
  id: string
  title: string
  iconSrc: string
  component: RoomControls | StyleControls | DummyToolsComponent
  isOpen: boolean
}

export interface TabConfig {
  id: string
  title: string
  iconSrc: string
  component: RoomControls | StyleControls | DummyToolsComponent
}

export type PanelChangeHandler = (params: Record<string, unknown>) => void

export class PanelManager {
  private panels: Map<string, PanelConfig> = new Map()
  private tabs: Map<string, TabConfig> = new Map()
  private container: HTMLDivElement | null = null
  private onStyleParamsChange: (params: StyleParams) => void
  private onModelAdd: (modelType: string) => void
  private onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void
  private onModelDelete?: (modelId: string) => void
  private getModels?: () => BaseModel[]
  private activeTabId: string = 'room'
  private isTabContainerOpen: boolean = true // 탭 컨테이너 열림/닫힘 상태
  private getCurrentRoomState?: () => RoomState
  
  // Content Managers
  private styleContentManager: StyleContentManager
  private toolsContentManager: ToolsContentManager
  private roomContentManager: RoomContentManager
  
  // 탭 컨테이너들
  private tabbedContainer: HTMLDivElement | null = null
  private tabHeaderContainer: HTMLDivElement | null = null
  private tabContentContainer: HTMLDivElement | null = null

  constructor(
    container: HTMLDivElement,
    onStyleParamsChange: (params: StyleParams) => void,
    onModelAdd: (modelType: string) => void,
    onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void,
    onModelDelete?: (modelId: string) => void,
    getModels?: () => BaseModel[],
    getCurrentRoomState?: () => RoomState
  ) {
    this.container = container
    this.onStyleParamsChange = onStyleParamsChange
    this.onModelAdd = onModelAdd
    this.onBookCreate = onBookCreate
    this.onModelDelete = onModelDelete
    this.getModels = getModels
    this.getCurrentRoomState = getCurrentRoomState
    
    // Content Managers 초기화
    this.styleContentManager = new StyleContentManager(onStyleParamsChange)
    this.toolsContentManager = new ToolsContentManager(onModelAdd, onBookCreate, onModelDelete, getModels)
    this.roomContentManager = new RoomContentManager()
    
    // 탭 컨테이너 초기화
    this.initializeTabbedContainer()
  }

  private initializeTabbedContainer(): void {
    if (!this.container) return

    // 메인 탭 컨테이너 생성
    this.tabbedContainer = document.createElement('div')
    this.tabbedContainer.id = 'tabbed-panel-container'
    Object.assign(this.tabbedContainer.style, {
      ...ROOM_CONTROL_STYLES.CONTAINER_PANEL,
      // 하단 가운데 위치
      position: 'fixed',
      bottom: '20px',
      left: '50%',
      transform: 'translateX(-50%)',
      right: 'auto',
      top: 'auto',
      overflow: 'visible', // 드롭다운을 위해
      display: 'flex',
      flexDirection: 'column-reverse' // 탭 헤더가 아래, 콘텐츠가 위로
    })

    // 탭 헤더 컨테이너 생성 (아래쪽)
    this.tabHeaderContainer = document.createElement('div')
    this.tabHeaderContainer.id = 'tab-header-container'
    Object.assign(this.tabHeaderContainer.style, {
      display: 'flex',
      borderTop: '2px solid #C0C0C0', // 위쪽 테두리
      backgroundColor: '#C0C0C0',
      borderRadius: '0 0 4px 4px' // 하단 모서리만 둥글게
    })

    // 탭 콘텐츠 컨테이너 생성 (위쪽)
    this.tabContentContainer = document.createElement('div')
    this.tabContentContainer.id = 'tab-content-container'
    Object.assign(this.tabContentContainer.style, {
      ...ROOM_CONTROL_STYLES.PANEL_CONTENT,
      opacity: '1',
      pointerEvents: 'auto',
      borderRadius: '4px 4px 0 0', // 상단 모서리만 둥글게
      maxHeight: '300px', // 최대 높이를 줄여서 탭 버튼이 보이도록
      transition: 'none', // 애니메이션 제거
      overflowY: 'auto', // 세로 스크롤만 허용
      overflowX: 'visible', // 가로는 드롭다운을 위해 visible
      padding: '0' // padding 제거
    })

    this.tabbedContainer.appendChild(this.tabHeaderContainer)
    this.tabbedContainer.appendChild(this.tabContentContainer)
    this.container.appendChild(this.tabbedContainer)
  }

  public addTab(config: TabConfig): void {
    this.tabs.set(config.id, config)
    
    // 탭 헤더 버튼 생성
    const tabButton = this.createTabButton(config)
    if (this.tabHeaderContainer) {
      this.tabHeaderContainer.appendChild(tabButton)
    }
    
    // 첫 번째 탭이면 활성화
    if (this.tabs.size === 1) {
      this.activeTabId = config.id
      this.showTabContent(config.id)
      this.updateTabButtonStates()
    }
  }

  private createTabButton(config: TabConfig): HTMLElement {
    const tabButton = document.createElement('div')
    tabButton.id = `tab-button-${config.id}`
    Object.assign(tabButton.style, {
      display: 'flex',
      alignItems: 'center',
      padding: '6px 12px',
      cursor: 'pointer',
      borderRight: '1px solid #808080',
      backgroundColor: '#C0C0C0',
      border: '2px outset #C0C0C0',
      borderTop: '2px solid #C0C0C0', // 위쪽 테두리 명시
      borderRadius: '4px 4px 0 0', // 상단 모서리만 둥글게 (하단 탭이므로)
      fontSize: '11px',
      fontFamily: '"W95FA", "MS Sans Serif", sans-serif',
      fontWeight: 'normal',
      color: '#000000',
      minWidth: '60px',
      justifyContent: 'center'
    })

    // 아이콘
    const icon = document.createElement('img')
    icon.src = config.iconSrc
    Object.assign(icon.style, {
      width: '16px',
      height: '16px',
      marginRight: '4px'
    })

    // 제목
    const title = document.createElement('span')
    title.textContent = config.title

    tabButton.appendChild(icon)
    tabButton.appendChild(title)

    // 클릭 이벤트
    tabButton.addEventListener('click', () => {
      this.switchTab(config.id)
    })

    // 호버 이벤트
    tabButton.addEventListener('mouseenter', () => {
      if (this.activeTabId !== config.id) {
        tabButton.style.backgroundColor = '#E0E0E0'
      }
    })

    tabButton.addEventListener('mouseleave', () => {
      if (this.activeTabId !== config.id) {
        tabButton.style.backgroundColor = '#C0C0C0'
      }
    })

    return tabButton
  }

  public switchTab(tabId: string): void {
    // 현재 활성화된 탭을 다시 클릭했을 때
    if (this.activeTabId === tabId && this.isTabContainerOpen) {
      this.toggleTabContainer()
      return
    }
    
    // 탭이 닫혀있는 상태에서 탭을 클릭했을 때 - 탭을 열고 해당 탭으로 전환
    if (!this.isTabContainerOpen) {
      this.isTabContainerOpen = true
      this.showTabContainer()
    }
    
    this.activeTabId = tabId
    this.showTabContent(tabId)
    this.updateTabButtonStates()
  }

  private toggleTabContainer(): void {
    this.isTabContainerOpen = !this.isTabContainerOpen
    
    if (this.isTabContainerOpen) {
      this.showTabContainer()
    } else {
      this.hideTabContainer()
    }
  }

  private showTabContainer(): void {
    if (!this.tabContentContainer) return
    
    // 콘텐츠 컨테이너 즉시 표시 (애니메이션 없음)
    Object.assign(this.tabContentContainer.style, {
      opacity: '1',
      pointerEvents: 'auto',
      maxHeight: '300px', // 최대 높이를 줄여서 탭 버튼이 보이도록
      overflowY: 'auto', // 세로 스크롤만 허용
      overflowX: 'visible', // 가로는 드롭다운을 위해 visible
      transition: 'none' // 열릴 때도 애니메이션 제거
    })
    
    // 현재 활성 탭의 콘텐츠 표시
    this.showTabContent(this.activeTabId)
    this.updateTabButtonStates()
  }

  private hideTabContainer(): void {
    if (!this.tabContentContainer) return
    
    // 콘텐츠 컨테이너 즉시 숨김 (애니메이션 없음)
    Object.assign(this.tabContentContainer.style, {
      opacity: '0',
      pointerEvents: 'none',
      maxHeight: '0px',
      transition: 'none' // 애니메이션 제거
    })
    
    // 모든 탭 버튼을 비활성 상태로 변경
    this.updateTabButtonStates(true)
  }

  private showTabContent(tabId: string): void {
    if (!this.tabContentContainer) return
    
    const tab = this.tabs.get(tabId)
    if (!tab) return

    // 기존 콘텐츠 제거
    this.tabContentContainer.innerHTML = ''

    // 새 콘텐츠 생성
    const content = this.extractComponentContent(tab.component)
    if (content) {
      this.tabContentContainer.appendChild(content)
    }
  }

  private updateTabButtonStates(allInactive?: boolean): void {
    this.tabs.forEach((tab, tabId) => {
      const tabButton = document.getElementById(`tab-button-${tabId}`)
      if (tabButton) {
        if (!allInactive && tabId === this.activeTabId && this.isTabContainerOpen) {
          // 활성 탭 스타일 (위로 열림)
          Object.assign(tabButton.style, {
            backgroundColor: '#FFFFFF',
            border: '2px inset #C0C0C0',
            borderTop: '2px solid #FFFFFF' // 위쪽 테두리를 흰색으로 연결
          })
        } else {
          // 비활성 탭 스타일
          Object.assign(tabButton.style, {
            backgroundColor: '#C0C0C0',
            border: '2px outset #C0C0C0',
            borderTop: '2px solid #C0C0C0'
          })
        }
      }
    })
  }

  public addPanel(panelConfig: PanelConfig): void {
    this.panels.set(panelConfig.id, panelConfig)
  }

  private extractComponentContent(component: RoomControls | StyleControls | DummyToolsComponent): HTMLElement | null {
    // 각 컴포넌트 타입별로 적절한 콘텐츠를 직접 생성
    if (component instanceof StyleControls) {
      return this.styleContentManager.createContent(component)
    } else if (component instanceof RoomControls) {
      return this.roomContentManager.createContent(component, this.onStyleParamsChange, this.getCurrentRoomState)
    } else {
      // Tools 컴포넌트의 경우 (더미 객체)
      return this.toolsContentManager.createContent()
    }
  }

  public getPanel(panelId: string): PanelConfig | undefined {
    return this.panels.get(panelId)
  }

  public getTab(tabId: string): TabConfig | undefined {
    return this.tabs.get(tabId)
  }

  public updateLayerModels(): void {
    this.toolsContentManager?.updateLayerModels()
  }

  public dispose(): void {
    this.styleContentManager?.dispose()
    this.roomContentManager?.dispose()
    this.toolsContentManager?.dispose()
    this.panels.clear()
    this.tabs.clear()
  }
}