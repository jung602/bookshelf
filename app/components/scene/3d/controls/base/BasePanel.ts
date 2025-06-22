import { ROOM_CONTROL_STYLES, ROOM_CONTROL_CONSTANTS } from '../styles/RoomControlsStyles'

export interface PanelConfig {
  title: string
  iconSrc: string
  isOpen?: boolean
  addToDOM?: boolean
}

export abstract class BasePanel<TParams = object> {
  protected params: TParams
  protected onParamsChange: (params: Partial<TParams>) => void
  protected container: HTMLDivElement | null = null
  protected headerContainer: HTMLDivElement | null = null
  protected buttonIcon: HTMLDivElement | null = null
  protected titleText: HTMLDivElement | null = null
  protected closeButton: HTMLDivElement | null = null
  protected panelContent: HTMLDivElement | null = null
  protected isOpen: boolean = false
  protected config: PanelConfig

  constructor(
    initialParams: TParams,
    onParamsChange: (params: Partial<TParams>) => void,
    config: PanelConfig,
    addToDOM: boolean = true
  ) {
    this.params = { ...initialParams }
    this.onParamsChange = onParamsChange
    this.config = { isOpen: true, addToDOM: true, ...config }
    this.isOpen = this.config.isOpen || false
    
    this.createContainer(addToDOM)
  }

  private createContainer(addToDOM: boolean = true): void {
    // 통합 컨테이너 생성
    this.container = document.createElement('div')
    Object.assign(this.container.style, ROOM_CONTROL_STYLES.CONTAINER_BUTTON)
    
    // 헤더 컨테이너 생성 (아이콘과 제목)
    this.createHeaderContainer()
    
    // 패널 콘텐츠 생성
    this.createPanelContentContainer()
    
    // 실제 콘텐츠는 서브클래스에서 구현
    this.createContent()
    
    // 컨테이너에 요소들 추가
    if (this.headerContainer) this.container.appendChild(this.headerContainer)
    if (this.panelContent) this.container.appendChild(this.panelContent)
    
    // 이벤트 설정
    this.setupContainerEvents()
    
    // DOM에 추가 (옵션)
    if (addToDOM) {
      document.body.appendChild(this.container)
    }
    
    // 초기 상태 설정
    if (this.isOpen) {
      this.openPanel()
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
    iconImg.src = this.config.iconSrc
    Object.assign(iconImg.style, ROOM_CONTROL_STYLES.BUTTON_ICON_IMAGE)
    
    this.buttonIcon.appendChild(iconImg)
  }

  private createTitleText(): void {
    this.titleText = document.createElement('div')
    this.titleText.textContent = this.config.title
    Object.assign(this.titleText.style, ROOM_CONTROL_STYLES.TITLE_TEXT)
  }

  private createCloseButton(): void {
    this.closeButton = document.createElement('div')
    Object.assign(this.closeButton.style, ROOM_CONTROL_STYLES.CLOSE_BUTTON)

    const closeIcon = document.createElement('img')
    closeIcon.src = this.isOpen ? '/icons/Minimize.png' : '/icons/Maximize.svg'
    Object.assign(closeIcon.style, ROOM_CONTROL_STYLES.CLOSE_BUTTON_IMAGE)
    this.closeButton.appendChild(closeIcon)

    // 호버 이벤트
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

  private createPanelContentContainer(): void {
    this.panelContent = document.createElement('div')
    Object.assign(this.panelContent.style, ROOM_CONTROL_STYLES.PANEL_CONTENT)
  }

  private setupContainerEvents(): void {
    if (!this.container) return

    // 전체 컨테이너 클릭 이벤트 (패널 토글)
    this.container.addEventListener('click', (e) => {
      // 패널 내부의 인터랙티브 요소들은 이벤트 버블링을 막도록 처리
      if (this.isOpen) {
        const target = e.target as HTMLElement
        // 인터랙티브 요소가 아닌 경우에만 패널 토글
        if (!target.closest('input, button, .grid-cell, [data-interactive="true"]')) {
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

  protected togglePanel(): void {
    if (!this.container || !this.panelContent) return
    
    this.isOpen = !this.isOpen
    
    if (this.isOpen) {
      this.openPanel()
    } else {
      this.closePanel()
    }
  }

  protected openPanel(): void {
    if (!this.container || !this.panelContent) return

    // 컨테이너를 패널 스타일로 변경
    Object.assign(this.container.style, ROOM_CONTROL_STYLES.CONTAINER_PANEL)
    
    // 개별 패널의 특별한 위치 설정이 있다면 적용
    this.applyCustomStyles()
    
    // 닫기 버튼 아이콘 업데이트
    this.updateCloseButtonIcon()
    
    // 패널 콘텐츠 나타남 (아이콘과 제목은 유지)
    setTimeout(() => {
      if (this.panelContent) {
        this.panelContent.style.opacity = '1'
        this.panelContent.style.pointerEvents = 'auto'
      }
    }, ROOM_CONTROL_CONSTANTS.ICON_FADE_DELAY)
  }

  protected closePanel(): void {
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
        // 개별 패널의 특별한 위치 설정이 있다면 적용
        this.applyCustomStyles()
      }
    }, ROOM_CONTROL_CONSTANTS.CONTENT_HIDE_DELAY)
  }

  private updateCloseButtonIcon(): void {
    if (!this.closeButton) return
    
    const closeIcon = this.closeButton.querySelector('img')
    if (closeIcon) {
      closeIcon.src = this.isOpen ? '/icons/Minimize.png' : '/icons/Maximize.svg'
    }
  }

  // 서브클래스에서 구현해야 하는 추상 메서드들
  protected abstract createContent(): void
  
  // 서브클래스에서 필요시 오버라이드할 수 있는 메서드들
  protected applyCustomStyles(): void {
    // 기본 구현은 빈 메서드 (개별 패널에서 필요시 오버라이드)
  }

  // 공개 메서드들
  public updateParams(params: Partial<TParams>): void {
    this.params = { ...this.params, ...params }
    this.onParamsChange(params)
  }

  public getParams(): TParams {
    return { ...this.params }
  }

  public getContainer(): HTMLElement | null {
    return this.container
  }

  public setOpen(isOpen: boolean): void {
    if (this.isOpen !== isOpen) {
      this.togglePanel()
    }
  }

  public dispose(): void {
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
    
    this.container = null
    this.headerContainer = null
    this.buttonIcon = null
    this.titleText = null
    this.closeButton = null
    this.panelContent = null
  }
} 