import { ROOM_CONTROL_STYLES } from '../styles/RoomControlsStyles'
import { GridPatterns } from '../patterns/GridPatterns'
import { getAssetPath } from '../utils'

export interface PresetButtonConfig {
  icon: string
  action: () => void
}

export interface PresetButtonsConfig {
  title: string
  presets: PresetButtonConfig[]
}

export class PresetButtons {
  private config: PresetButtonsConfig
  private section: HTMLElement | null = null

  constructor(config: PresetButtonsConfig) {
    this.config = config
  }

  public static createGridPresets(onChange: (grid: boolean[][]) => void, applyPattern: (pattern: boolean[][], onChange: (grid: boolean[][]) => void) => void): PresetButtonsConfig {
    return {
      title: 'Shapes',
      presets: [
        { icon: 'preA.svg', action: () => applyPattern(GridPatterns.createFullPattern(), onChange) },
        { icon: 'preB.svg', action: () => applyPattern(GridPatterns.createLPattern(), onChange) },
        { icon: 'preC.svg', action: () => applyPattern(GridPatterns.createReverseLPattern(), onChange) },
        { icon: 'PreD.svg', action: () => applyPattern(GridPatterns.createTPattern(), onChange) },
        { icon: 'preE.svg', action: () => applyPattern(GridPatterns.createCompactCrossPattern(), onChange) }
      ]
    }
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

    // 프리셋 버튼 컨테이너
    const presetsContainer = document.createElement('div')
    Object.assign(presetsContainer.style, ROOM_CONTROL_STYLES.PRESETS_CONTAINER)

    // 프리셋 버튼들 생성
    this.config.presets.forEach(preset => {
      const button = this.createPresetButton(preset)
      presetsContainer.appendChild(button)
    })

    this.section.appendChild(presetsContainer)
    return this.section
  }

  private createPresetButton(preset: PresetButtonConfig): HTMLButtonElement {
    const button = document.createElement('button')
    Object.assign(button.style, ROOM_CONTROL_STYLES.PRESET_ICON_BUTTON)

    // 아이콘 이미지
    const iconImg = document.createElement('img')
    iconImg.src = getAssetPath(`/icons/presets/${preset.icon}`)
    Object.assign(iconImg.style, ROOM_CONTROL_STYLES.PRESET_ICON_IMAGE)
    button.appendChild(iconImg)

    // 이벤트 설정
    this.attachButtonEvents(button, preset)

    return button
  }

  private attachButtonEvents(button: HTMLButtonElement, preset: PresetButtonConfig): void {
    button.addEventListener('mouseenter', () => {
      Object.assign(button.style, ROOM_CONTROL_STYLES.PRESET_ICON_BUTTON_HOVER)
    })

    button.addEventListener('mouseleave', () => {
      Object.assign(button.style, ROOM_CONTROL_STYLES.PRESET_ICON_BUTTON)
    })

    button.addEventListener('click', (e) => {
      e.stopPropagation()
      preset.action()
    })
  }

  public updatePresets(presets: PresetButtonConfig[]): void {
    this.config.presets = presets
    
    if (this.section) {
      // 기존 프리셋 컨테이너 제거하고 새로 생성
      const presetsContainer = this.section.querySelector('div:last-child')
      if (presetsContainer) {
        this.section.removeChild(presetsContainer)
      }
      
      const newPresetsContainer = document.createElement('div')
      Object.assign(newPresetsContainer.style, ROOM_CONTROL_STYLES.PRESETS_CONTAINER)
      
      presets.forEach(preset => {
        const button = this.createPresetButton(preset)
        newPresetsContainer.appendChild(button)
      })
      
      this.section.appendChild(newPresetsContainer)
    }
  }

  public dispose(): void {
    // 이벤트 리스너는 자동으로 정리됨 (DOM 요소와 함께)
    this.section = null
  }
} 