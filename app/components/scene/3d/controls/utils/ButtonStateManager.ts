import { ROOM_CONTROL_STYLES } from '../styles/RoomControlsStyles'
import { type ToolType } from '../constants/ControlsConstants'

export class ButtonStateManager {
  /**
   * 도구 버튼들의 선택 상태 업데이트
   */
  public static updateToolButtons(selectedTool: ToolType): void {
    const toolButtons = document.querySelectorAll('button')
    toolButtons.forEach(button => {
      const textElement = button.querySelector('div:last-child') as HTMLElement
      if (textElement) {
        this.updateToolButtonState(button, textElement, selectedTool)
      }
    })
  }

  /**
   * 개별 도구 버튼의 상태 업데이트
   */
  private static updateToolButtonState(
    button: HTMLElement, 
    textElement: HTMLElement, 
    selectedTool: ToolType
  ): void {
    const buttonText = textElement.textContent

    if (buttonText === 'Pen') {
      this.applyButtonStyle(button, selectedTool === 'pen')
    } else if (buttonText === 'Eraser') {
      this.applyButtonStyle(button, selectedTool === 'eraser')
    }
  }

  /**
   * 버튼에 선택/비선택 스타일 적용
   */
  private static applyButtonStyle(button: HTMLElement, isSelected: boolean): void {
    if (isSelected) {
      Object.assign(button.style, {
        ...ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER,
        ...ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER_SELECTED
      })
    } else {
      Object.assign(button.style, ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER)
    }
  }

  /**
   * 특정 타입의 모든 버튼 상태 리셋
   */
  public static resetAllToolButtons(): void {
    const toolButtons = document.querySelectorAll('button')
    toolButtons.forEach(button => {
      const textElement = button.querySelector('div:last-child') as HTMLElement
      if (textElement && (textElement.textContent === 'Pen' || textElement.textContent === 'Eraser')) {
        Object.assign(button.style, ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER)
      }
    })
  }
} 