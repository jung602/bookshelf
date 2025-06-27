import { ROOM_CONTROL_STYLES } from './styles/RoomControlsStyles'
import { RoomControls, RoomParams } from './RoomControls'
import { StyleControls, StyleParams } from './StyleControls'
import { PanelManager } from './managers/PanelManager'

export class ControlsContainer {
  private container: HTMLDivElement | null = null
  private panelManager: PanelManager | null = null
  private roomControls: RoomControls | null = null
  private styleControls: StyleControls | null = null

  constructor(
    roomParams: RoomParams,
    styleParams: StyleParams,
    onRoomParamsChange: (params: Partial<RoomParams>) => void,
    onStyleParamsChange: (params: Partial<StyleParams>) => void,
    onModelAdd?: (modelType: string) => void,
    onBookCreate?: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void
  ) {
    this.createContainer()
    this.initializePanels(
      roomParams, 
      styleParams, 
      onRoomParamsChange, 
      onStyleParamsChange,
      onModelAdd || (() => {}),
      onBookCreate || (() => {})
    )
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
    onStyleParamsChange: (params: Partial<StyleParams>) => void,
    onModelAdd: (modelType: string) => void,
    onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void
  ): void {
    if (!this.container) return

    // PanelManager 초기화
    this.panelManager = new PanelManager(
      this.container,
      onStyleParamsChange,
      onModelAdd,
      onBookCreate
    )

    // Room Controls 패널 (DOM에 추가하지 않음)
    this.roomControls = new RoomControls(roomParams, onRoomParamsChange, false)
    this.panelManager.addPanel({
      id: 'room',
      title: 'Room',
      iconSrc: '/icons/room.png',
      component: this.roomControls,
      isOpen: true
    })

    // Style Controls 패널 (DOM에 추가하지 않음) 
    this.styleControls = new StyleControls(styleParams, onStyleParamsChange, false)
    this.panelManager.addPanel({
      id: 'style',
      title: 'Style',
      iconSrc: '/icons/style.png',
      component: this.styleControls,
      isOpen: true
    })

    // Tools 패널 (PanelManager에서 직접 처리하므로 더미 객체 전달)
    const dummyToolsControls = {} // Tools 패널은 PanelManager에서 직접 처리
    this.panelManager.addPanel({
      id: 'tools',
      title: 'Tools',
      iconSrc: '/icons/room.png',
      component: dummyToolsControls,
      isOpen: true
    })
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
    this.panelManager?.dispose()
    
    if (this.container) {
      this.container.remove()
      this.container = null
    }
  }
} 