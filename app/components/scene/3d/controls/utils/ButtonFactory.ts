import { ROOM_CONTROL_STYLES } from '../styles/RoomControlsStyles'
import { type ToolType } from '../constants/ControlsConstants'
import { getAssetPath } from './index'

export interface ToolButtonConfig {
  text: string
  tool: ToolType
  selectedTool: ToolType
  onToolChange: (tool: ToolType) => void
}

export interface ActionButtonConfig {
  text: string
  action: () => void
}

export class ButtonFactory {
  /**
   * 도구 버튼 (펜/지우개) 생성
   */
  public static createToolButton(config: ToolButtonConfig): HTMLElement {
    const button = document.createElement('button')
    
    // 기본 스타일 적용
    if (config.selectedTool === config.tool) {
      Object.assign(button.style, {
        ...ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER,
        ...ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER_SELECTED
      })
    } else {
      Object.assign(button.style, ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER)
    }

    // 아이콘 컨테이너 생성
    const iconContainer = document.createElement('div')
    Object.assign(iconContainer.style, ROOM_CONTROL_STYLES.ICON_BUTTON_ICON_CONTAINER)

    // 아이콘 이미지 생성 (도구에 따라 적절한 아이콘 사용)
    const icon = document.createElement('img')
    icon.src = ButtonFactory.getToolIcon(config.tool)
    Object.assign(icon.style, ROOM_CONTROL_STYLES.ICON_BUTTON_ICON_IMAGE)
    iconContainer.appendChild(icon)

    // 텍스트 생성
    const textElement = document.createElement('div')
    textElement.textContent = config.text
    Object.assign(textElement.style, ROOM_CONTROL_STYLES.ICON_BUTTON_TEXT)

    // 버튼에 아이콘과 텍스트 추가
    button.appendChild(iconContainer)
    button.appendChild(textElement)

    button.addEventListener('click', () => {
      config.onToolChange(config.tool)
    })

    return button
  }

  /**
   * 액션 버튼 (Save/Reset) 생성
   */
  public static createActionButton(config: ActionButtonConfig): HTMLElement {
    const button = document.createElement('button')
    Object.assign(button.style, ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER)

    // 아이콘 컨테이너 생성
    const iconContainer = document.createElement('div')
    Object.assign(iconContainer.style, ROOM_CONTROL_STYLES.ICON_BUTTON_ICON_CONTAINER)

    // 아이콘 이미지 생성 (텍스트에 따라 적절한 아이콘 사용)
    const icon = document.createElement('img')
    icon.src = ButtonFactory.getActionIcon(config.text)
    Object.assign(icon.style, ROOM_CONTROL_STYLES.ICON_BUTTON_ICON_IMAGE)
    iconContainer.appendChild(icon)

    // 텍스트 생성
    const textElement = document.createElement('div')
    textElement.textContent = config.text
    Object.assign(textElement.style, ROOM_CONTROL_STYLES.ICON_BUTTON_TEXT)

    // 버튼에 아이콘과 텍스트 추가
    button.appendChild(iconContainer)
    button.appendChild(textElement)

    // 호버 이벤트 추가
    ButtonFactory.addHoverEffects(button)

    button.addEventListener('click', config.action)
    return button
  }

  /**
   * 도구에 따른 아이콘 경로 반환
   */
  private static getToolIcon(tool: ToolType): string {
    switch (tool) {
      case 'pen':
        return getAssetPath('/icons/pen.png')
      case 'eraser':
        return getAssetPath('/icons/eraser.png')
      default:
        return getAssetPath('/icons/pen.png')
    }
  }

  /**
   * 액션에 따른 아이콘 경로 반환
   */
  private static getActionIcon(action: string): string {
    switch (action) {
      case 'Save':
        return getAssetPath('/icons/save.svg')
      case 'Reset':
        return getAssetPath('/icons/reset.png')
      default:
        return getAssetPath('/icons/room.png')
    }
  }

  /**
   * 버튼에 호버 효과 추가
   */
  private static addHoverEffects(button: HTMLElement): void {
    button.addEventListener('mouseenter', () => {
      Object.assign(button.style, {
        ...ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER,
        ...ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER_HOVER
      })
    })

    button.addEventListener('mouseleave', () => {
      Object.assign(button.style, ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER)
    })
  }
} 