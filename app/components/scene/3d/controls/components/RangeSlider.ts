import { ROOM_CONTROL_STYLES } from '../styles/RoomControlsStyles'

export interface RangeSliderConfig {
  title: string
  min: number
  max: number
  step: number
  initialValue: number
  onChange: (value: number) => void
  containerStyle?: Partial<CSSStyleDeclaration>
}

const SLIDER_THUMB_CSS = `
  input[type="range"]::-webkit-slider-thumb {
    appearance: none;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #4A90E2;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  input[type="range"]::-webkit-slider-thumb:hover {
    background: #357ABD;
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }

  input[type="range"]::-moz-range-thumb {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #4A90E2;
    cursor: pointer;
    border: none;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
  }

  input[type="range"]::-moz-range-thumb:hover {
    background: #357ABD;
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
  }
`

export class RangeSlider {
  private config: RangeSliderConfig
  private section: HTMLElement | null = null
  private slider: HTMLInputElement | null = null
  private static stylesAdded = false

  constructor(config: RangeSliderConfig) {
    this.config = config
  }

  public create(): HTMLElement {
    // 섹션 컨테이너
    this.section = document.createElement('div')
    const defaultStyle = ROOM_CONTROL_STYLES.SECTION_CONTAINER
    const customStyle = this.config.containerStyle || {}
    Object.assign(this.section.style, {
      ...defaultStyle,
      ...customStyle
    })

    // 타이틀
    const titleElement = document.createElement('div')
    titleElement.textContent = this.config.title
    Object.assign(titleElement.style, ROOM_CONTROL_STYLES.SECTION_TITLE)
    this.section.appendChild(titleElement)

    // 슬라이더
    this.slider = document.createElement('input')
    this.slider.type = 'range'
    this.slider.min = this.config.min.toString()
    this.slider.max = this.config.max.toString()
    this.slider.step = this.config.step.toString()
    this.slider.value = this.config.initialValue.toString()
    Object.assign(this.slider.style, ROOM_CONTROL_STYLES.SLIDER)

    // 슬라이더 스타일 추가
    this.addSliderThumbStyles()

    // 이벤트 설정
    this.attachEvents()

    this.section.appendChild(this.slider)
    return this.section
  }

  private addSliderThumbStyles(): void {
    if (RangeSlider.stylesAdded) return
    
    const style = document.createElement('style')
    style.id = 'slider-thumb-styles'
    style.textContent = SLIDER_THUMB_CSS
    document.head.appendChild(style)
    
    RangeSlider.stylesAdded = true
  }

  private attachEvents(): void {
    if (!this.slider) return

    this.slider.addEventListener('input', (e) => {
      const value = parseInt((e.target as HTMLInputElement).value)
      this.config.onChange(value)
    })
  }

  public getValue(): number {
    return this.slider ? parseInt(this.slider.value) : this.config.initialValue
  }

  public setValue(value: number): void {
    if (this.slider) {
      this.slider.value = value.toString()
    }
  }

  public updateConfig(config: Partial<RangeSliderConfig>): void {
    this.config = { ...this.config, ...config }
    
    if (this.slider) {
      if (config.min !== undefined) this.slider.min = config.min.toString()
      if (config.max !== undefined) this.slider.max = config.max.toString()
      if (config.step !== undefined) this.slider.step = config.step.toString()
      if (config.initialValue !== undefined) this.slider.value = config.initialValue.toString()
    }
  }

  public dispose(): void {
    // 이벤트 리스너는 자동으로 정리됨 (DOM 요소와 함께)
    this.section = null
    this.slider = null
  }
} 