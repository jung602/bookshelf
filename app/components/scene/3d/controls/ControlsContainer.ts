import { ROOM_CONTROL_STYLES } from './styles/RoomControlsStyles'
import { RoomControls, RoomParams } from './RoomControls'
import { BaseModel } from '../objects/BaseModel'
import { ColorParams } from '../SceneManager'

import { PanelManager } from './managers/PanelManager'
import { getAssetPath } from './utils'

// 스타일 파라미터 타입 정의
export interface StyleParams {
  wallColor?: string
  floorColor?: string
  [key: string]: unknown
}

// 현재 룸 상태 타입 정의
export interface RoomState {
  roomParams: RoomParams
  colorParams: ColorParams
}

export class ControlsContainer {
  private container: HTMLDivElement | null = null
  private panelManager: PanelManager | null = null
  private roomControls: RoomControls | null = null

  constructor(
    roomParams: RoomParams,
    onRoomParamsChange: (params: Partial<RoomParams>) => void,
    onStyleParamsChange: (params: StyleParams) => void,
    onModelAdd?: (modelType: string) => void,
    onBookCreate?: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void,
    onModelDelete?: (modelId: string) => void,
    getModels?: () => BaseModel[],
    getCurrentRoomState?: () => RoomState
  ) {
    this.createContainer()
    this.initializePanels(
      roomParams, 
      onRoomParamsChange, 
      onStyleParamsChange,
      onModelAdd || (() => {}),
      onBookCreate || (() => {}),
      onModelDelete,
      getModels,
      getCurrentRoomState
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
    onRoomParamsChange: (params: Partial<RoomParams>) => void,
    onStyleParamsChange: (params: StyleParams) => void,
    onModelAdd: (modelType: string) => void,
    onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void,
    onModelDelete?: (modelId: string) => void,
    getModels?: () => BaseModel[],
    getCurrentRoomState?: () => RoomState
  ): void {
    if (!this.container) return

    // PanelManager 초기화
    this.panelManager = new PanelManager(
      this.container,
      onStyleParamsChange,
      onModelAdd,
      onBookCreate,
      onModelDelete,
      getModels,
      getCurrentRoomState
    )

    // Room Controls 탭 (DOM에 추가하지 않음)
    this.roomControls = new RoomControls(roomParams, onRoomParamsChange, false)
    this.panelManager.addTab({
      id: 'room',
      title: 'Room',
      iconSrc: getAssetPath('/icons/room.png'),
      component: this.roomControls
    })

    // Tools 탭 (PanelManager에서 직접 처리하므로 더미 객체 전달)
    const dummyToolsControls = {} // Tools 탭은 PanelManager에서 직접 처리
    this.panelManager.addTab({
      id: 'tools',
      title: 'Tools',
      iconSrc: getAssetPath('/icons/pen.png'),
      component: dummyToolsControls
    })
  }

  // 공개 메서드들
  public getRoomControls(): RoomControls | null {
    return this.roomControls
  }

  public updateRoomParams(params: Partial<RoomParams>): void {
    this.roomControls?.updateParams(params)
  }

  public updateLayerModels(): void {
    this.panelManager?.updateLayerModels()
  }

  public dispose(): void {
    this.roomControls?.dispose()
    this.panelManager?.dispose()
    
    if (this.container) {
      this.container.remove()
      this.container = null
    }
  }
} 