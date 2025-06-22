interface ModelGizmoProps {
  modelId: string | null
  position: { x: number; y: number } | null
  onRotate: (modelId: string) => void
  onDelete: (modelId: string) => void
  onClose: () => void
}

export class ModelGizmo {
  private container: HTMLDivElement | null = null
  private backdrop: HTMLDivElement | null = null
  private gizmo: HTMLDivElement | null = null
  private isVisible: boolean = false
  private props: ModelGizmoProps
  private eventCleanupFunctions: (() => void)[] = []

  constructor(props: ModelGizmoProps) {
    this.props = props
    this.createContainer()
    this.updateVisibility()
  }

  private createContainer(): void {
    // 배경 (클릭 시 닫기)
    this.backdrop = document.createElement('div')
    Object.assign(this.backdrop.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      zIndex: '40',
      backgroundColor: 'transparent',
      pointerEvents: 'none',
      display: 'none'
    })

    // 기즈모 UI
    this.container = document.createElement('div')
    Object.assign(this.container.style, {
      position: 'fixed',
      zIndex: '50',
      pointerEvents: 'none',
      display: 'none'
    })
    this.container.setAttribute('data-gizmo', 'true')

    this.createGizmoContent()
    this.setupEventListeners()

    document.body.appendChild(this.backdrop)
    document.body.appendChild(this.container)
  }

  private createGizmoContent(): void {
    if (!this.container) return

    this.gizmo = document.createElement('div')
    Object.assign(this.gizmo.style, {
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(8px)',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      border: '1px solid #e5e7eb',
      padding: '8px',
      display: 'flex',
      gap: '8px',
      alignItems: 'center',
      pointerEvents: 'auto'
    })

    // 회전 버튼
    const rotateButton = this.createButton('🔄', '90도 회전', () => {
      if (this.props.modelId) {
        this.props.onRotate(this.props.modelId)
      }
    })

    // 삭제 버튼
    const deleteButton = this.createButton('🗑️', '삭제', () => {
      if (this.props.modelId) {
        this.props.onDelete(this.props.modelId)
        this.props.onClose()
      }
    }, true)

    this.gizmo.appendChild(rotateButton)
    this.gizmo.appendChild(deleteButton)
    this.container.appendChild(this.gizmo)
  }

  private createButton(text: string, title: string, onClick: () => void, isDelete: boolean = false): HTMLButtonElement {
    const button = document.createElement('button')
    button.textContent = text
    button.title = title
    
    const baseStyle = {
      width: '36px',
      height: '36px',
      borderRadius: '6px',
      border: isDelete ? '1px solid #fca5a5' : '1px solid #d1d5db',
      backgroundColor: isDelete ? '#fef2f2' : '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      fontSize: '16px'
    }
    
    Object.assign(button.style, baseStyle)

    button.addEventListener('mouseenter', () => {
      button.style.backgroundColor = isDelete ? '#fee2e2' : '#f3f4f6'
      button.style.borderColor = isDelete ? '#f87171' : '#9ca3af'
    })

    button.addEventListener('mouseleave', () => {
      button.style.backgroundColor = isDelete ? '#fef2f2' : '#ffffff'
      button.style.borderColor = isDelete ? '#fca5a5' : '#d1d5db'
    })

    button.addEventListener('click', onClick)
    return button
  }

  private setupEventListeners(): void {
    const handleMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const gizmoElement = document.querySelector('[data-gizmo="true"]')
      
      if (gizmoElement && !gizmoElement.contains(target)) {
        this.props.onClose()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      if (e.buttons > 0) {
        this.props.onClose()
      }
    }

    const handleWheel = () => {
      this.props.onClose()
    }

    const handleTouchStart = (e: TouchEvent) => {
      const target = e.target as HTMLElement
      const gizmoElement = document.querySelector('[data-gizmo="true"]')
      
      if (gizmoElement && !gizmoElement.contains(target)) {
        this.props.onClose()
      }
    }

    const handleTouchMove = () => {
      this.props.onClose()
    }

    // 이벤트 리스너 등록
    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('wheel', handleWheel)
    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)

    // 정리 함수들 저장
    this.eventCleanupFunctions.push(
      () => document.removeEventListener('mousedown', handleMouseDown),
      () => document.removeEventListener('mousemove', handleMouseMove),
      () => document.removeEventListener('wheel', handleWheel),
      () => document.removeEventListener('touchstart', handleTouchStart),
      () => document.removeEventListener('touchmove', handleTouchMove)
    )
  }

  public updateProps(newProps: ModelGizmoProps): void {
    this.props = newProps
    this.updateVisibility()
    this.updatePosition()
  }

  private updateVisibility(): void {
    const shouldBeVisible = !!(this.props.modelId && this.props.position)
    
    if (shouldBeVisible !== this.isVisible) {
      this.isVisible = shouldBeVisible
      
      if (this.container && this.backdrop) {
        this.container.style.display = this.isVisible ? 'block' : 'none'
        this.backdrop.style.display = this.isVisible ? 'block' : 'none'
      }
    }
  }

  private updatePosition(): void {
    if (!this.container || !this.props.position) return

    this.container.style.left = `${this.props.position.x}px`
    this.container.style.top = `${this.props.position.y}px`
    this.container.style.transform = 'translate(-50%, -100%)'
  }

  public dispose(): void {
    // 이벤트 리스너 정리
    this.eventCleanupFunctions.forEach(cleanup => cleanup())
    this.eventCleanupFunctions = []

    // DOM 요소 제거
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
    if (this.backdrop && this.backdrop.parentNode) {
      this.backdrop.parentNode.removeChild(this.backdrop)
    }

    this.container = null
    this.backdrop = null
    this.gizmo = null
  }
} 