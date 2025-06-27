import { ROOM_CONTROL_STYLES } from '../styles/RoomControlsStyles'
import { WINDOWS_PALETTE } from '../constants/ControlsConstants'

export interface ColorPaletteConfig {
  title: string
  initialColor: string
  colorType?: string
  onChange: (color: string) => void
}

export class ColorPaletteUtils {
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

    // 색상 팔레트 생성 및 이벤트 설정
    const colorPalette = ColorPaletteUtils.createColorPalette(colorDisplay, config.onChange)
    ColorPaletteUtils.setupColorDisplayEvents(colorDisplay, colorPalette)

    return container
  }

  /**
   * 색상 팔레트 DOM 생성
   */
  private static createColorPalette(colorDisplay: HTMLElement, onChange: (color: string) => void): HTMLElement {
    const colorPalette = document.createElement('div')
    Object.assign(colorPalette.style, ROOM_CONTROL_STYLES.COLOR_PALETTE_CONTAINER)

    WINDOWS_PALETTE.forEach((color) => {
      const colorCell = ColorPaletteUtils.createColorCell(color, colorDisplay, colorPalette, onChange)
      colorPalette.appendChild(colorCell)
    })

    document.body.appendChild(colorPalette)
    return colorPalette
  }

  /**
   * 개별 색상 셀 생성
   */
  private static createColorCell(
    color: string, 
    colorDisplay: HTMLElement, 
    colorPalette: HTMLElement, 
    onChange: (color: string) => void
  ): HTMLElement {
    const colorCell = document.createElement('div')
    Object.assign(colorCell.style, {
      ...ROOM_CONTROL_STYLES.COLOR_PALETTE_CELL,
      backgroundColor: color
    })

    // 호버 효과
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

    // 클릭 이벤트
    colorCell.addEventListener('click', () => {
      colorDisplay.style.backgroundColor = color
      colorPalette.style.display = 'none'
      onChange(color)
    })

    return colorCell
  }

  /**
   * 색상 표시 영역 이벤트 설정
   */
  private static setupColorDisplayEvents(colorDisplay: HTMLElement, colorPalette: HTMLElement): void {
    colorDisplay.addEventListener('click', (e) => {
      e.stopPropagation()
      ColorPaletteUtils.toggleColorPalette(colorDisplay, colorPalette)
    })

    // 외부 클릭시 팔레트 닫기
    document.addEventListener('click', (e) => {
      if (!colorPalette.contains(e.target as Node) && !colorDisplay.contains(e.target as Node)) {
        colorPalette.style.display = 'none'
      }
    })
  }

  /**
   * 색상 팔레트 토글
   */
  private static toggleColorPalette(colorDisplay: HTMLElement, colorPalette: HTMLElement): void {
    if (colorPalette.style.display === 'none' || !colorPalette.style.display) {
      const rect = colorDisplay.getBoundingClientRect()
      colorPalette.style.left = `${rect.left}px`
      colorPalette.style.top = `${rect.bottom + 4}px`
      colorPalette.style.display = 'grid'
    } else {
      colorPalette.style.display = 'none'
    }
  }
} 