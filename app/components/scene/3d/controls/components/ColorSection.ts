import { ROOM_CONTROL_STYLES } from '../styles/RoomControlsStyles'
import { WINDOWS_PALETTE } from '../constants/ControlsConstants'

export interface ColorSectionConfig {
  title: string
  initialColor: string
  onChange: (color: string) => void
}

export class ColorSection {
  private config: ColorSectionConfig
  private section: HTMLElement | null = null
  private colorPalette: HTMLElement | null = null
  private currentColorDisplay: HTMLElement | null = null
  private closeHandler: (() => void) | null = null

  constructor(config: ColorSectionConfig) {
    this.config = config
  }

  public create(): HTMLElement {
    // 섹션 컨테이너
    this.section = document.createElement('div')
    Object.assign(this.section.style, ROOM_CONTROL_STYLES.SECTION_CONTAINER)

    // 타이틀
    const titleElement = document.createElement('div')
    titleElement.textContent = this.config.title
    Object.assign(titleElement.style, ROOM_CONTROL_STYLES.SECTION_TITLE)
    this.section.appendChild(titleElement)

    // 현재 선택된 색상 표시 (정사각형)
    this.currentColorDisplay = document.createElement('div')
    Object.assign(this.currentColorDisplay.style, {
      width: '28px',
      height: '28px',
      backgroundColor: this.config.initialColor,
      border: '2px solid #000000',
      cursor: 'pointer',
      marginBottom: '4px',
      boxShadow: ROOM_CONTROL_STYLES.BUTTON.boxShadow
    })

    // 컬러 팔레트 생성
    this.createColorPalette()

    // 이벤트 설정
    this.attachEvents()

    // 정리 함수 추가 (메모리 누수 방지)
    this.section.setAttribute('data-cleanup', 'true')
    ;(this.section as HTMLElement & { cleanup?: () => void }).cleanup = () => this.dispose()

    this.section.appendChild(this.currentColorDisplay)
    return this.section
  }

  private createColorPalette(): void {
    // 컬러 팔레트 (처음에는 숨김)
    this.colorPalette = document.createElement('div')
    Object.assign(this.colorPalette.style, ROOM_CONTROL_STYLES.COLOR_PALETTE_CONTAINER)

    // 4x4 컬러 그리드 생성
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
        if (this.currentColorDisplay) {
          this.currentColorDisplay.style.backgroundColor = color
        }
        if (this.colorPalette) {
          this.colorPalette.style.display = 'none'
        }
        this.config.onChange(color)
      })

      if (this.colorPalette) {
        this.colorPalette.appendChild(colorCell)
      }
    })

    // 팔레트를 body에 붙여서 overflow 문제 해결
    if (this.colorPalette) {
      document.body.appendChild(this.colorPalette)
    }
  }

  private attachEvents(): void {
    if (!this.currentColorDisplay || !this.colorPalette) return

    // 현재 색상 클릭 시 팔레트 토글
    this.currentColorDisplay.addEventListener('click', (e) => {
      e.stopPropagation()
      if (this.colorPalette && this.currentColorDisplay) {
        if (this.colorPalette.style.display === 'none') {
          // 현재 색상 표시 박스의 위치 계산
          const rect = this.currentColorDisplay.getBoundingClientRect()
          this.colorPalette.style.left = `${rect.left}px`
          this.colorPalette.style.top = `${rect.bottom + 4}px`
          this.colorPalette.style.display = 'grid'
        } else {
          this.colorPalette.style.display = 'none'
        }
      }
    })

    // 다른 곳 클릭 시 팔레트 닫기
    this.closeHandler = () => {
      if (this.colorPalette) {
        this.colorPalette.style.display = 'none'
      }
    }
    document.addEventListener('click', this.closeHandler)

    // 팔레트 내부 클릭 시 이벤트 전파 방지
    if (this.colorPalette) {
      this.colorPalette.addEventListener('click', (e) => {
        e.stopPropagation()
      })
    }
  }

  public updateColor(color: string): void {
    if (this.currentColorDisplay) {
      this.currentColorDisplay.style.backgroundColor = color
    }
  }

  public getColor(): string {
    return this.currentColorDisplay?.style.backgroundColor || this.config.initialColor
  }

  public dispose(): void {
    // 이벤트 리스너 제거
    if (this.closeHandler) {
      document.removeEventListener('click', this.closeHandler)
      this.closeHandler = null
    }

    // DOM 요소 제거
    if (this.colorPalette && this.colorPalette.parentNode) {
      document.body.removeChild(this.colorPalette)
    }

    // 참조 해제
    this.section = null
    this.colorPalette = null
    this.currentColorDisplay = null
  }
} 