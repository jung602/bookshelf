import { ROOM_CONTROL_STYLES, ROOM_CONTROL_CONSTANTS, ROOM_CONTROL_ICON } from './styles/RoomControlsStyles'
import { GridPatterns } from './patterns/GridPatterns'
import { GridComponent } from './components/GridComponent'
import type { RoomParams } from './types/RoomControlTypes'

export type { RoomParams }

export class RoomControls {
  private params: RoomParams
  private onParamsChange: (params: Partial<RoomParams>) => void
  private container: HTMLDivElement | null = null
  private buttonIcon: HTMLDivElement | null = null
  private panelContent: HTMLDivElement | null = null
  private gridComponent: GridComponent | null = null
  private heightSlider: HTMLInputElement | null = null
  private isOpen: boolean = false
  
  constructor(
    initialParams: RoomParams,
    onParamsChange: (params: Partial<RoomParams>) => void
  ) {
    this.params = { ...initialParams }
    this.ensureCenterTile()
    this.onParamsChange = onParamsChange
    this.createContainer()
  }

  private ensureCenterTile(): void {
    if (!Array.isArray(this.params.customGrid)) {
      this.params.customGrid = GridPatterns.createEmptyGrid()
    }
    GridPatterns.ensureCenterTile(this.params.customGrid)
  }

  private createContainer(): void {
    // 통합 컨테이너 생성
    this.container = document.createElement('div')
    Object.assign(this.container.style, ROOM_CONTROL_STYLES.CONTAINER_BUTTON)
    
    // 버튼 아이콘 생성
    this.createButtonIcon()
    
    // 패널 콘텐츠 생성
    this.createPanelContent()
    
    // 컨테이너에 요소들 추가
    if (this.panelContent) this.container.appendChild(this.panelContent)
    if (this.buttonIcon) this.container.appendChild(this.buttonIcon)
    
    // 이벤트 설정
    this.setupContainerEvents()
    
    // DOM에 추가
    document.body.appendChild(this.container)
  }

  private createButtonIcon(): void {
    this.buttonIcon = document.createElement('div')
    Object.assign(this.buttonIcon.style, ROOM_CONTROL_STYLES.BUTTON_ICON)
    this.buttonIcon.innerHTML = ROOM_CONTROL_ICON
    
    this.buttonIcon.addEventListener('click', (e) => {
      e.stopPropagation()
      if (!this.isOpen) {
        this.togglePanel()
      }
    })
  }

  private createPanelContent(): void {
    this.panelContent = document.createElement('div')
    Object.assign(this.panelContent.style, ROOM_CONTROL_STYLES.PANEL_CONTENT)
    
    this.createCloseButton()
    this.createHeightSlider()
    this.createGrid()
    this.createPresetButtons()
  }

  private setupContainerEvents(): void {
    if (!this.container) return

    this.container.addEventListener('mouseenter', () => {
      if (!this.isOpen && this.container) {
        this.container.style.backgroundColor = 'rgba(248, 250, 252, 0.8)'
        this.container.style.border = '1px solid rgba(200, 200, 200, 0.3)'
        this.container.style.transform = 'translateX(-50%) scale(1.05)'
      }
    })
    
    this.container.addEventListener('mouseleave', () => {
      if (!this.isOpen && this.container) {
        this.container.style.backgroundColor = 'rgba(253, 254, 255, 0)'
        this.container.style.border = '1px solid rgba(200, 200, 200, 0)'
        this.container.style.transform = 'translateX(-50%) scale(1)'
      }
    })
  }

  private togglePanel(): void {
    if (!this.container || !this.buttonIcon || !this.panelContent) return
    
    this.isOpen = !this.isOpen
    
    if (this.isOpen) {
      this.openPanel()
    } else {
      this.closePanel()
    }
  }

  private openPanel(): void {
    if (!this.container || !this.buttonIcon || !this.panelContent) return

    // 1단계: 아이콘 사라짐
    this.buttonIcon.style.opacity = '0'
    this.buttonIcon.style.transform = 'scale(0.8)'
    this.buttonIcon.style.pointerEvents = 'none'
    
    // 2단계: 컨테이너 확장
    setTimeout(() => {
      if (this.container) {
        this.container.style.cursor = 'default'
        Object.assign(this.container.style, ROOM_CONTROL_STYLES.CONTAINER_PANEL)
      }
    }, ROOM_CONTROL_CONSTANTS.ICON_FADE_DELAY)
    
    // 3단계: 패널 콘텐츠 나타남
    setTimeout(() => {
      if (this.panelContent) {
        this.panelContent.style.opacity = '1'
        this.panelContent.style.pointerEvents = 'auto'
      }
    }, ROOM_CONTROL_CONSTANTS.CONTENT_SHOW_DELAY)
  }

  private closePanel(): void {
    if (!this.container || !this.buttonIcon || !this.panelContent) return

    // 1단계: 패널 콘텐츠 사라짐
    this.panelContent.style.opacity = '0'
    this.panelContent.style.pointerEvents = 'none'
    
    // 2단계: 컨테이너 축소
    setTimeout(() => {
      if (this.container) {
        // 기존 스타일을 완전히 초기화하고 버튼 스타일 적용
        this.container.style.cssText = ''
        Object.assign(this.container.style, ROOM_CONTROL_STYLES.CONTAINER_BUTTON)
      }
    }, ROOM_CONTROL_CONSTANTS.CONTENT_HIDE_DELAY)
    
    // 3단계: 아이콘 나타남
    setTimeout(() => {
      if (this.buttonIcon) {
        this.buttonIcon.style.opacity = '1'
        this.buttonIcon.style.transform = 'scale(1)'
        this.buttonIcon.style.pointerEvents = 'auto'
      }
    }, ROOM_CONTROL_CONSTANTS.ICON_SHOW_DELAY)
  }

  private createCloseButton(): void {
    if (!this.panelContent) return
    
    const closeButton = document.createElement('div')
    closeButton.innerHTML = '×'
    closeButton.style.cssText = `
      position: absolute;
      top: 8px;
      right: 12px;
      width: 20px;
      height: 20px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      font-weight: bold;
      color: #666;
      border-radius: 4px;
      transition: all 0.2s;
      z-index: 10;
    `
    
    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = 'rgba(255, 0, 0, 0.1)'
      closeButton.style.color = '#ff0000'
    })
    
    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = 'transparent'
      closeButton.style.color = '#666'
    })
    
    closeButton.addEventListener('click', (e) => {
      e.stopPropagation()
      this.togglePanel()
    })
    
    this.panelContent.appendChild(closeButton)
  }

  private createHeightSlider(): void {
    if (!this.panelContent) return
    
    
    this.heightSlider = document.createElement('input')
    this.heightSlider.type = 'range'
    this.heightSlider.min = '1'
    this.heightSlider.max = '10'
    this.heightSlider.step = '1'
    this.heightSlider.value = this.params.wallHeight.toString()
    Object.assign(this.heightSlider.style, ROOM_CONTROL_STYLES.SLIDER)
    
    this.heightSlider.addEventListener('input', (e) => {
      const target = e.target as HTMLInputElement
      const value = parseInt(target.value)
      this.onParamsChange({ wallHeight: value })
    })
    
    this.panelContent.appendChild(this.heightSlider)
  }

  private createGrid(): void {
    if (!this.panelContent) return
    
    this.gridComponent = new GridComponent(
      this.panelContent,
      this.params.customGrid,
      (newGrid) => {
        this.params.customGrid = newGrid
        this.onParamsChange({ customGrid: newGrid })
      }
    )
    
    const gridContainer = this.gridComponent.create()
    this.panelContent.appendChild(gridContainer)
  }

  private createPresetButtons(): void {
    if (!this.panelContent) return
    
    const presets = [
      { title: 'Cross Shape', action: () => this.applyPattern(GridPatterns.createCrossPattern()) },
      { title: 'L Shape', action: () => this.applyPattern(GridPatterns.createLPattern()) },
      { title: 'Full 5x5', action: () => this.applyPattern(GridPatterns.createFullPattern()) },
      { title: 'Reset to Center', action: () => this.applyPattern(GridPatterns.createEmptyGrid()) }
    ]
    
    presets.forEach(preset => {
      const button = this.createPresetButton(preset.title, preset.action)
      this.panelContent!.appendChild(button)
    })
  }

  private createPresetButton(title: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button')
    button.textContent = title
    Object.assign(button.style, ROOM_CONTROL_STYLES.BUTTON)
    
    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = 'rgba(255, 255, 255, 0.3)'
      button.style.transform = 'translateY(-1px)'
    })
    
    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = 'rgba(255, 255, 255, 0.2)'
      button.style.transform = 'translateY(0)'
    })
    
    button.addEventListener('click', action)
    return button
  }

  private applyPattern(pattern: boolean[][]): void {
    this.params.customGrid = pattern
    this.gridComponent?.updateGrid(pattern)
    this.onParamsChange({ customGrid: pattern })
  }

  // 공개 메서드들
  public updateParams(params: Partial<RoomParams>): void {
    Object.assign(this.params, params)
    
    if (params.wallHeight && this.heightSlider) {
      this.heightSlider.value = params.wallHeight.toString()
    }
    
    if (params.customGrid) {
      this.gridComponent?.updateGrid(params.customGrid)
    }
  }

  public getParams(): RoomParams {
    return { ...this.params }
  }

  public dispose(): void {
    this.gridComponent?.dispose()
    
    if (this.container) {
      this.container.remove()
      this.container = null
      this.buttonIcon = null
      this.panelContent = null
    }
  }
} 