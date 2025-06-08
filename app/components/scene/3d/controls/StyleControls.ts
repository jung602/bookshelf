import { ROOM_CONTROL_STYLES, ROOM_CONTROL_CONSTANTS } from './styles/RoomControlsStyles'

export interface StyleParams {
  wallColor: string
  floorColor: string
}

export class StyleControls {
  private params: StyleParams
  private onParamsChange: (params: Partial<StyleParams>) => void
  private container: HTMLDivElement | null = null
  private headerContainer: HTMLDivElement | null = null
  private buttonIcon: HTMLDivElement | null = null
  private titleText: HTMLDivElement | null = null
  private closeButton: HTMLDivElement | null = null
  private panelContent: HTMLDivElement | null = null
  private wallColorInput: HTMLInputElement | null = null
  private floorColorInput: HTMLInputElement | null = null
  private isOpen: boolean = false
  
  constructor(
    initialParams: StyleParams,
    onParamsChange: (params: Partial<StyleParams>) => void,
    addToDOM: boolean = true
  ) {
    this.params = { ...initialParams }
    this.onParamsChange = onParamsChange
    this.createContainer(addToDOM)
  }

  private createContainer(addToDOM: boolean = true): void {
    // 통합 컨테이너 생성
    this.container = document.createElement('div')
    Object.assign(this.container.style, ROOM_CONTROL_STYLES.CONTAINER_BUTTON)
    
    // 위치를 툴바 아래로 조정
    this.container.style.bottom = '80px'
    this.container.style.left = '50%'
    this.container.style.transform = 'translateX(-50%)'
    this.container.style.right = 'auto'
    this.container.style.top = 'auto'
    
    // 헤더 컨테이너 생성 (아이콘과 제목)
    this.createHeaderContainer()
    
    // 패널 콘텐츠 생성
    this.createPanelContent()
    
    // 컨테이너에 요소들 추가
    if (this.headerContainer) this.container.appendChild(this.headerContainer)
    if (this.panelContent) this.container.appendChild(this.panelContent)
    
    // 이벤트 설정
    this.setupContainerEvents()
    
    // DOM에 추가 (옵션)
    if (addToDOM) {
      document.body.appendChild(this.container)
    }
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
    iconImg.src = '/icons/Question.svg'
    Object.assign(iconImg.style, ROOM_CONTROL_STYLES.BUTTON_ICON_IMAGE)
    
    this.buttonIcon.appendChild(iconImg)
  }

  private createTitleText(): void {
    this.titleText = document.createElement('div')
    this.titleText.textContent = 'Style'
    Object.assign(this.titleText.style, ROOM_CONTROL_STYLES.TITLE_TEXT)
  }

  private createPanelContent(): void {
    this.panelContent = document.createElement('div')
    Object.assign(this.panelContent.style, ROOM_CONTROL_STYLES.PANEL_CONTENT)
    
    this.createColorInputs()
  }

  private setupContainerEvents(): void {
    if (!this.container) return

    // 전체 컨테이너 클릭 이벤트 (패널 토글)
    this.container.addEventListener('click', (e) => {
      // 패널 내부의 인터랙티브 요소들은 이벤트 버블링을 막도록 처리
      if (this.isOpen) {
        const target = e.target as HTMLElement
        // 컬러 인풋 등의 인터랙티브 요소가 아닌 경우에만 패널 토글
        if (!target.closest('input, button')) {
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
    
    // 위치 재설정
    this.container.style.bottom = '80px'
    this.container.style.left = '50%'
    this.container.style.transform = 'translateX(-50%)'
    this.container.style.right = 'auto'
    this.container.style.top = 'auto'
    
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
        // 위치 재설정
        this.container.style.bottom = '80px'
        this.container.style.left = '50%'
        this.container.style.transform = 'translateX(-50%)'
        this.container.style.right = 'auto'
        this.container.style.top = 'auto'
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

  private createColorInputs(): void {
    if (!this.panelContent) return
    
    // Wall Color 섹션 컨테이너 생성
    const wallColorContainer = document.createElement('div')
    Object.assign(wallColorContainer.style, {
      ...ROOM_CONTROL_STYLES.SECTION_CONTAINER,
      ...ROOM_CONTROL_STYLES.SECTION_CONTAINER_FIRST
    })
    
    // Wall Color 타이틀 추가
    const wallColorTitle = document.createElement('div')
    wallColorTitle.textContent = 'Wall Color'
    Object.assign(wallColorTitle.style, {
      ...ROOM_CONTROL_STYLES.SECTION_TITLE,
      marginTop: '0px'
    })
    wallColorContainer.appendChild(wallColorTitle)
    
    // 벽 색상 인풋 생성
    this.wallColorInput = document.createElement('input')
    this.wallColorInput.type = 'color'
    this.wallColorInput.value = this.params.wallColor
    Object.assign(this.wallColorInput.style, {
      width: '100%',
      height: '28px',
      border: 'none',
      borderRadius: '0px',
      cursor: 'pointer',
      margin: '0',
      padding: '2px',
      boxShadow: 'inset -1px -1px rgba(38, 38, 38, 1), inset 1px 1px rgba(255, 255, 255, 0.8), inset -2px -2px rgba(126, 126, 126, 1)',
      backgroundColor: '#ffffff'
    })
    
    this.wallColorInput.addEventListener('change', (e) => {
      e.stopPropagation()
      const target = e.target as HTMLInputElement
      this.onParamsChange({ wallColor: target.value })
    })

    this.wallColorInput.addEventListener('click', (e) => {
      e.stopPropagation()
    })
    
    wallColorContainer.appendChild(this.wallColorInput)
    this.panelContent.appendChild(wallColorContainer)
    
    // Floor Color 섹션 컨테이너 생성
    const floorColorContainer = document.createElement('div')
    Object.assign(floorColorContainer.style, ROOM_CONTROL_STYLES.SECTION_CONTAINER)
    
    // Floor Color 타이틀 추가
    const floorColorTitle = document.createElement('div')
    floorColorTitle.textContent = 'Floor Color'
    Object.assign(floorColorTitle.style, {
      ...ROOM_CONTROL_STYLES.SECTION_TITLE,
      marginTop: '0px'
    })
    floorColorContainer.appendChild(floorColorTitle)
    
    // 바닥 색상 인풋 생성
    this.floorColorInput = document.createElement('input')
    this.floorColorInput.type = 'color'
    this.floorColorInput.value = this.params.floorColor
    Object.assign(this.floorColorInput.style, {
      width: '100%',
      height: '28px',
      border: 'none',
      borderRadius: '0px',
      cursor: 'pointer',
      margin: '0',
      padding: '2px',
      boxShadow: 'inset -1px -1px rgba(38, 38, 38, 1), inset 1px 1px rgba(255, 255, 255, 0.8), inset -2px -2px rgba(126, 126, 126, 1)',
      backgroundColor: '#ffffff'
    })
    
    this.floorColorInput.addEventListener('change', (e) => {
      e.stopPropagation()
      const target = e.target as HTMLInputElement
      this.onParamsChange({ floorColor: target.value })
    })

    this.floorColorInput.addEventListener('click', (e) => {
      e.stopPropagation()
    })
    
    floorColorContainer.appendChild(this.floorColorInput)
    this.panelContent.appendChild(floorColorContainer)
  }

  // 공개 메서드들
  public updateParams(params: Partial<StyleParams>): void {
    Object.assign(this.params, params)
    
    if (params.wallColor && this.wallColorInput) {
      this.wallColorInput.value = params.wallColor
    }
    
    if (params.floorColor && this.floorColorInput) {
      this.floorColorInput.value = params.floorColor
    }
  }

  public getParams(): StyleParams {
    return { ...this.params }
  }

  public dispose(): void {
    if (this.container) {
      this.container.remove()
      this.container = null
      this.headerContainer = null
      this.buttonIcon = null
      this.titleText = null
      this.closeButton = null
      this.panelContent = null
      this.wallColorInput = null
      this.floorColorInput = null
    }
  }
} 