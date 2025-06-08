import { ROOM_CONTROL_STYLES, ROOM_CONTROL_CONSTANTS, SLIDER_THUMB_CSS } from './styles/RoomControlsStyles'
import { GridPatterns } from './patterns/GridPatterns'
import { GridComponent } from './components/GridComponent'
import type { RoomParams } from './types/RoomControlTypes'

export type { RoomParams }

export class RoomControls {
  private params: RoomParams
  private onParamsChange: (params: Partial<RoomParams>) => void
  private container: HTMLDivElement | null = null
  private headerContainer: HTMLDivElement | null = null
  private buttonIcon: HTMLDivElement | null = null
  private titleText: HTMLDivElement | null = null
  private closeButton: HTMLDivElement | null = null
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
    
    // 헤더 컨테이너 생성 (아이콘과 제목)
    this.createHeaderContainer()
    
    // 패널 콘텐츠 생성
    this.createPanelContent()
    
    // 컨테이너에 요소들 추가
    if (this.headerContainer) this.container.appendChild(this.headerContainer)
    if (this.panelContent) this.container.appendChild(this.panelContent)
    
    // 이벤트 설정
    this.setupContainerEvents()
    
    // DOM에 추가
    document.body.appendChild(this.container)
  }

  private createHeaderContainer(): void {
    this.headerContainer = document.createElement('div')
    Object.assign(this.headerContainer.style, ROOM_CONTROL_STYLES.HEADER_CONTAINER)
    
    // 헤더 왼쪽 부분 (아이콘 + 제목)
    const headerLeft = document.createElement('div')
    Object.assign(headerLeft.style, ROOM_CONTROL_STYLES.HEADER_LEFT)
    
    // 헤더 오른쪽 부분 (닫기 버튼)
    const headerRight = document.createElement('div')
    Object.assign(headerRight.style, ROOM_CONTROL_STYLES.HEADER_RIGHT)
    
    // 버튼 아이콘 생성
    this.createButtonIcon()
    
    // 제목 텍스트 생성
    this.createTitleText()
    
    // 닫기 버튼 생성
    this.createCloseButton()
    
    // 헤더 왼쪽에 아이콘과 제목 추가
    if (this.buttonIcon) headerLeft.appendChild(this.buttonIcon)
    if (this.titleText) headerLeft.appendChild(this.titleText)
    
    // 헤더 오른쪽에 닫기 버튼 추가
    if (this.closeButton) headerRight.appendChild(this.closeButton)
    
    // 헤더에 왼쪽 부분과 오른쪽 부분 추가
    this.headerContainer.appendChild(headerLeft)
    this.headerContainer.appendChild(headerRight)
    
    // 헤더 클릭 이벤트 (닫기 버튼은 제외)
    headerLeft.addEventListener('click', (e) => {
      e.stopPropagation()
      this.togglePanel()
    })
  }

  private createButtonIcon(): void {
    this.buttonIcon = document.createElement('div')
    Object.assign(this.buttonIcon.style, ROOM_CONTROL_STYLES.BUTTON_ICON)
    
    const iconImg = document.createElement('img')
    iconImg.src = '/icons/grid.svg'
    Object.assign(iconImg.style, ROOM_CONTROL_STYLES.BUTTON_ICON_IMAGE)
    
    this.buttonIcon.appendChild(iconImg)
  }

  private createTitleText(): void {
    this.titleText = document.createElement('div')
    this.titleText.textContent = 'Room'
    Object.assign(this.titleText.style, ROOM_CONTROL_STYLES.TITLE_TEXT)
  }

  private createPanelContent(): void {
    this.panelContent = document.createElement('div')
    Object.assign(this.panelContent.style, ROOM_CONTROL_STYLES.PANEL_CONTENT)
    
    this.createHeightSlider()
    this.createGrid()
    this.createPresetButtons()
  }

  private setupContainerEvents(): void {
    if (!this.container) return

    // 전체 컨테이너 클릭 이벤트 (패널 토글)
    this.container.addEventListener('click', (e) => {
      // 패널 내부의 인터랙티브 요소들은 이벤트 버블링을 막도록 처리
      if (this.isOpen) {
        const target = e.target as HTMLElement
        // 슬라이더, 버튼, 그리드 등의 인터랙티브 요소가 아닌 경우에만 패널 토글
        if (!target.closest('input, button, .grid-cell')) {
          this.togglePanel()
        }
      } else {
        this.togglePanel()
      }
    })
    
    this.container.addEventListener('mouseleave', () => {
      if (!this.isOpen && this.container) {
        Object.assign(this.container.style, ROOM_CONTROL_STYLES.CONTAINER_BUTTON)
      }
    })
  }

  private togglePanel(): void {
    if (!this.container || !this.panelContent) return
    
    this.isOpen = !this.isOpen
    
    if (this.isOpen) {
      this.openPanel()
    } else {
      this.closePanel()
    }
  }

  private openPanel(): void {
    if (!this.container || !this.panelContent) return

    // 컨테이너를 패널 스타일로 변경
    Object.assign(this.container.style, ROOM_CONTROL_STYLES.CONTAINER_PANEL)
    
    // 닫기 버튼 아이콘 업데이트
    this.updateCloseButtonIcon()
    
    // 패널 콘텐츠 나타남 (아이콘과 제목은 유지)
    setTimeout(() => {
      if (this.panelContent) {
        this.panelContent.style.opacity = '1'
        this.panelContent.style.pointerEvents = 'auto'
      }
    }, 100)
  }

  private closePanel(): void {
    if (!this.container || !this.panelContent) return

    // 패널 콘텐츠 사라짐
    this.panelContent.style.opacity = '0'
    this.panelContent.style.pointerEvents = 'none'
    
    // 닫기 버튼 아이콘 업데이트
    this.updateCloseButtonIcon()
    
    // 컨테이너를 버튼 스타일로 되돌림
    setTimeout(() => {
      if (this.container) {
        this.container.style.cssText = ''
        Object.assign(this.container.style, ROOM_CONTROL_STYLES.CONTAINER_BUTTON)
      }
    }, ROOM_CONTROL_CONSTANTS.CONTENT_HIDE_DELAY)
  }

  private createCloseButton(): void {
    this.closeButton = document.createElement('div')
    Object.assign(this.closeButton.style, ROOM_CONTROL_STYLES.CLOSE_BUTTON)
    
    // 초기 아이콘 설정 (닫힌 상태이므로 Maximize.svg)
    const closeIcon = document.createElement('img')
    closeIcon.src = '/icons/Maximize.svg'
    Object.assign(closeIcon.style, ROOM_CONTROL_STYLES.CLOSE_BUTTON_IMAGE)
    
    this.closeButton.appendChild(closeIcon)
    
    this.closeButton.addEventListener('mouseenter', () => {
      if (this.closeButton) {
        Object.assign(this.closeButton.style, ROOM_CONTROL_STYLES.CLOSE_BUTTON_HOVER)
      }
    })
    
    this.closeButton.addEventListener('mouseleave', () => {
      if (this.closeButton) {
        Object.assign(this.closeButton.style, ROOM_CONTROL_STYLES.CLOSE_BUTTON)
      }
    })
    
    this.closeButton.addEventListener('click', (e) => {
      e.stopPropagation()
      this.togglePanel()
    })
  }

  private updateCloseButtonIcon(): void {
    if (!this.closeButton) return
    
    const iconImg = this.closeButton.querySelector('img')
    if (iconImg) {
      if (this.isOpen) {
        iconImg.src = '/icons/Minimize.png'
      } else {
        iconImg.src = '/icons/Maximize.svg'
      }
    }
  }

  private createHeightSlider(): void {
    if (!this.panelContent) return
    
    // Walls 섹션 컨테이너 생성
    const wallsContainer = document.createElement('div')
    Object.assign(wallsContainer.style, {
      ...ROOM_CONTROL_STYLES.SECTION_CONTAINER,
      ...ROOM_CONTROL_STYLES.SECTION_CONTAINER_FIRST
    })
    
    // Walls 타이틀 추가
    const wallsTitle = document.createElement('div')
    wallsTitle.textContent = 'Walls'
    Object.assign(wallsTitle.style, {
      ...ROOM_CONTROL_STYLES.SECTION_TITLE,
      marginTop: '0px'
    })
    wallsContainer.appendChild(wallsTitle)
    
    this.heightSlider = document.createElement('input')
    this.heightSlider.type = 'range'
    this.heightSlider.min = '1'
    this.heightSlider.max = '5'
    this.heightSlider.step = '1'
    this.heightSlider.value = this.params.wallHeight.toString()
    Object.assign(this.heightSlider.style, ROOM_CONTROL_STYLES.SLIDER)
    
    // 슬라이더 핸들 스타일 적용
    this.addSliderThumbStyles()
    
    this.heightSlider.addEventListener('input', (e) => {
      e.stopPropagation()  // 이벤트 전파 방지
      const target = e.target as HTMLInputElement
      const value = parseInt(target.value)
      this.onParamsChange({ wallHeight: value })
    })

    this.heightSlider.addEventListener('click', (e) => {
      e.stopPropagation()  // 클릭 이벤트 전파 방지
    })
    
    wallsContainer.appendChild(this.heightSlider)
    this.panelContent.appendChild(wallsContainer)
  }

  private addSliderThumbStyles(): void {
    if (document.getElementById('slider-thumb-styles')) return
    
    const style = document.createElement('style')
    style.id = 'slider-thumb-styles'
    style.textContent = SLIDER_THUMB_CSS
    document.head.appendChild(style)
  }

  private createGrid(): void {
    if (!this.panelContent) return
    
    // Floors 섹션 컨테이너 생성
    const floorsContainer = document.createElement('div')
    Object.assign(floorsContainer.style, ROOM_CONTROL_STYLES.SECTION_CONTAINER)
    
    // Floors 타이틀 추가
    const floorsTitle = document.createElement('div')
    floorsTitle.textContent = 'Floors'
    Object.assign(floorsTitle.style, {
      ...ROOM_CONTROL_STYLES.SECTION_TITLE,
      marginTop: '0px'
    })
    floorsContainer.appendChild(floorsTitle)
    
    this.gridComponent = new GridComponent(
      floorsContainer,
      this.params.customGrid,
      (newGrid) => {
        this.params.customGrid = newGrid
        this.onParamsChange({ customGrid: newGrid })
      }
    )
    
    const gridContainer = this.gridComponent.create()
    floorsContainer.appendChild(gridContainer)
    this.panelContent.appendChild(floorsContainer)
  }

  private createPresetButtons(): void {
    if (!this.panelContent) return
    
    // Shapes 섹션 컨테이너 생성
    const shapesContainer = document.createElement('div')
    Object.assign(shapesContainer.style, ROOM_CONTROL_STYLES.SECTION_CONTAINER)
    
    // Shapes 타이틀 추가
    const shapesTitle = document.createElement('div')
    shapesTitle.textContent = 'Shapes'
    Object.assign(shapesTitle.style, {
      ...ROOM_CONTROL_STYLES.SECTION_TITLE,
      marginTop: '0px'
    })
    shapesContainer.appendChild(shapesTitle)
    
    // 프리셋 버튼 컨테이너 생성
    const presetsContainer = document.createElement('div')
    Object.assign(presetsContainer.style, ROOM_CONTROL_STYLES.PRESETS_CONTAINER)
    
    const presets = [
      { icon: 'preA.svg', action: () => this.applyPattern(GridPatterns.createFullPattern()) },
      { icon: 'preB.svg', action: () => this.applyPattern(GridPatterns.createLPattern()) },
      { icon: 'preC.svg', action: () => this.applyPattern(GridPatterns.createReverseLPattern()) },
      { icon: 'PreD.svg', action: () => this.applyPattern(GridPatterns.createTPattern()) },
      { icon: 'preE.svg', action: () => this.applyPattern(GridPatterns.createCompactCrossPattern()) }
    ]
    
    presets.forEach(preset => {
      const button = this.createIconPresetButton(preset.icon, preset.action)
      presetsContainer.appendChild(button)
    })
    
    shapesContainer.appendChild(presetsContainer)
    this.panelContent.appendChild(shapesContainer)
  }

  private createIconPresetButton(iconFileName: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button')
    Object.assign(button.style, ROOM_CONTROL_STYLES.PRESET_ICON_BUTTON)
    
    // SVG 아이콘 로드
    const iconImg = document.createElement('img')
    iconImg.src = `/icons/presets/${iconFileName}`
    Object.assign(iconImg.style, ROOM_CONTROL_STYLES.PRESET_ICON_IMAGE)
    
    button.appendChild(iconImg)
    
    button.addEventListener('mouseenter', () => {
      Object.assign(button.style, ROOM_CONTROL_STYLES.PRESET_ICON_BUTTON_HOVER)
    })
    
    button.addEventListener('mouseleave', () => {
      Object.assign(button.style, ROOM_CONTROL_STYLES.PRESET_ICON_BUTTON)
    })
    
    button.addEventListener('click', (e) => {
      e.stopPropagation()  // 이벤트 전파 방지
      action()
    })
    return button
  }

  private createPresetButton(title: string, action: () => void): HTMLButtonElement {
    const button = document.createElement('button')
    button.textContent = title
    Object.assign(button.style, ROOM_CONTROL_STYLES.BUTTON)
    
    button.addEventListener('mouseenter', () => {
      Object.assign(button.style, ROOM_CONTROL_STYLES.BUTTON_HOVER)
    })
    
    button.addEventListener('mouseleave', () => {
      Object.assign(button.style, ROOM_CONTROL_STYLES.BUTTON)
    })
    
    button.addEventListener('click', (e) => {
      e.stopPropagation()  // 이벤트 전파 방지
      action()
    })
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
      this.headerContainer = null
      this.buttonIcon = null
      this.titleText = null
      this.closeButton = null
      this.panelContent = null
    }
  }
} 