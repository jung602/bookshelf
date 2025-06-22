import { ROOM_CONTROL_STYLES } from '../styles/RoomControlsStyles'
import { WINDOWS_PALETTE, type ToolType } from '../constants/ControlsConstants'

export interface ToolButtonConfig {
  text: string
  tool: ToolType
  selectedTool: ToolType
  onToolChange: (tool: ToolType) => void
}

export interface ColorPaletteConfig {
  title: string
  initialColor: string
  colorType?: string
  onChange: (color: string) => void
}

export interface ActionButtonConfig {
  text: string
  action: () => void
}

export class UIUtils {
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
    if (config.tool === 'pen') {
      icon.src = '/icons/pen.png'
    } else if (config.tool === 'eraser') {
      icon.src = '/icons/eraser.png'
    } else {
      icon.src = '/icons/room.png' // 기본값
    }
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
    if (config.text === 'Save') {
      icon.src = '/icons/save.svg'
    } else if (config.text === 'Reset') {
      icon.src = '/icons/reset.png'
    } else {
      icon.src = '/icons/room.png' // 기본값
    }
    Object.assign(icon.style, ROOM_CONTROL_STYLES.ICON_BUTTON_ICON_IMAGE)
    iconContainer.appendChild(icon)

    // 텍스트 생성
    const textElement = document.createElement('div')
    textElement.textContent = config.text
    Object.assign(textElement.style, ROOM_CONTROL_STYLES.ICON_BUTTON_TEXT)

    // 버튼에 아이콘과 텍스트 추가
    button.appendChild(iconContainer)
    button.appendChild(textElement)

    button.addEventListener('mouseenter', () => {
      Object.assign(button.style, {
        ...ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER,
        ...ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER_HOVER
      })
    })

    button.addEventListener('mouseleave', () => {
      Object.assign(button.style, ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER)
    })

    button.addEventListener('click', config.action)
    return button
  }

  /**
   * 컴팩트 색상 섹션 생성
   */
  public static createCompactColorSection(config: ColorPaletteConfig): HTMLElement {
    const container = document.createElement('div')
    Object.assign(container.style, ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER)

    // 색상 표시 컨테이너 (아이콘 역할)
    const colorContainer = document.createElement('div')
    Object.assign(colorContainer.style, ROOM_CONTROL_STYLES.ICON_BUTTON_ICON_CONTAINER)

    const colorDisplay = document.createElement('div')
    Object.assign(colorDisplay.style, {
      width: '100%',
      height: '100%',
      backgroundColor: config.initialColor,
      cursor: 'pointer'
    })
    
    // 색상 타입에 따라 데이터 속성 추가
    if (config.colorType) {
      colorDisplay.setAttribute('data-color-type', config.colorType)
    }

    colorContainer.appendChild(colorDisplay)

    // 텍스트 생성 (아래쪽)
    const textElement = document.createElement('div')
    textElement.textContent = config.title
    Object.assign(textElement.style, ROOM_CONTROL_STYLES.ICON_BUTTON_TEXT)

    // 컨테이너에 색상 표시와 텍스트 추가
    container.appendChild(colorContainer)
    container.appendChild(textElement)

    // 색상 팔레트 생성
    const colorPalette = document.createElement('div')
    Object.assign(colorPalette.style, ROOM_CONTROL_STYLES.COLOR_PALETTE_CONTAINER)

    WINDOWS_PALETTE.forEach((color) => {
      const colorCell = document.createElement('div')
      Object.assign(colorCell.style, {
        ...ROOM_CONTROL_STYLES.COLOR_PALETTE_CELL,
        backgroundColor: color
      })

      colorCell.addEventListener('mouseenter', () => {
        Object.assign(colorCell.style, {
          ...ROOM_CONTROL_STYLES.COLOR_PALETTE_CELL_HOVER,
          backgroundColor: color
        })
      })

      colorCell.addEventListener('mouseleave', () => {
        Object.assign(colorCell.style, {
          ...ROOM_CONTROL_STYLES.COLOR_PALETTE_CELL,
          backgroundColor: color
        })
      })

      colorCell.addEventListener('click', () => {
        colorDisplay.style.backgroundColor = color
        colorPalette.style.display = 'none'
        config.onChange(color)
      })

      colorPalette.appendChild(colorCell)
    })

    document.body.appendChild(colorPalette)

    colorDisplay.addEventListener('click', (e) => {
      e.stopPropagation()
      if (colorPalette.style.display === 'none') {
        const rect = colorDisplay.getBoundingClientRect()
        colorPalette.style.left = `${rect.left}px`
        colorPalette.style.top = `${rect.bottom + 4}px`
        colorPalette.style.display = 'grid'
      } else {
        colorPalette.style.display = 'none'
      }
    })

    return container
  }

  /**
   * 도구 버튼들의 선택 상태 업데이트
   */
  public static updateToolButtons(selectedTool: ToolType): void {
    const toolButtons = document.querySelectorAll('button')
    toolButtons.forEach(button => {
      const textElement = button.querySelector('div:last-child') as HTMLElement
      if (textElement && textElement.textContent === 'Pen') {
        if (selectedTool === 'pen') {
          Object.assign(button.style, {
            ...ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER,
            ...ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER_SELECTED
          })
        } else {
          Object.assign(button.style, ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER)
        }
      } else if (textElement && textElement.textContent === 'Eraser') {
        if (selectedTool === 'eraser') {
          Object.assign(button.style, {
            ...ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER,
            ...ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER_SELECTED
          })
        } else {
          Object.assign(button.style, ROOM_CONTROL_STYLES.ICON_BUTTON_CONTAINER)
        }
      }
    })
  }
} 