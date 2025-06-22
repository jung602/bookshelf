import { availableModels } from '../../objects'

export interface ModelType {
  id: string
  name: string
  description: string
  icon: string
}

interface ModelSelectorProps {
  onModelAdd: (modelType: string) => void
  onShowBookCreator?: () => void
}

export class ModelSelector {
  private container: HTMLDivElement | null = null
  private button: HTMLButtonElement | null = null
  private dropdown: HTMLDivElement | null = null
  private isDropdownOpen: boolean = false
  private props: ModelSelectorProps
  private eventCleanupFunctions: (() => void)[] = []

  constructor(props: ModelSelectorProps) {
    this.props = props
    this.createContainer()
  }

  private createContainer(): void {
    this.container = document.createElement('div')
    this.container.style.position = 'relative'

    this.createButton()
    this.createDropdown()
    this.setupEventListeners()
  }

  private createButton(): void {
    this.button = document.createElement('button')
    Object.assign(this.button.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 16px',
      backgroundColor: '#3b82f6',
      color: 'white',
      border: 'none',
      borderRadius: '8px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      transition: 'all 0.2s',
      boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
    })

    // 버튼 내용
    const icon = document.createElement('span')
    icon.textContent = '📦'
    
    const text = document.createElement('span')
    text.textContent = '모델 추가'
    
    const arrow = document.createElement('span')
    arrow.textContent = '▼'
    arrow.style.transition = 'transform 0.2s'
    arrow.setAttribute('data-arrow', 'true')

    this.button.appendChild(icon)
    this.button.appendChild(text)
    this.button.appendChild(arrow)

    // 버튼 이벤트
    this.button.addEventListener('mouseenter', () => {
      if (this.button) {
        this.button.style.backgroundColor = '#2563eb'
        this.button.style.transform = 'translateY(-1px)'
        this.button.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)'
      }
    })

    this.button.addEventListener('mouseleave', () => {
      if (this.button) {
        this.button.style.backgroundColor = '#3b82f6'
        this.button.style.transform = 'translateY(0)'
        this.button.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)'
      }
    })

    this.button.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleDropdown()
    })

    if (this.container) {
      this.container.appendChild(this.button)
    }
  }

  private createDropdown(): void {
    this.dropdown = document.createElement('div')
    Object.assign(this.dropdown.style, {
      position: 'absolute',
      bottom: '100%',
      left: '0',
      marginBottom: '8px',
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      border: '1px solid #e5e7eb',
      minWidth: '200px',
      zIndex: '100',
      overflow: 'hidden',
      display: 'none'
    })

    availableModels.forEach((model, index) => {
      const item = document.createElement('button')
      Object.assign(item.style, {
        width: '100%',
        padding: '12px 16px',
        border: 'none',
        backgroundColor: 'transparent',
        textAlign: 'left',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
        borderBottom: index < availableModels.length - 1 ? '1px solid #f3f4f6' : 'none'
      })

      const content = document.createElement('div')
      Object.assign(content.style, {
        display: 'flex',
        alignItems: 'center',
        gap: '12px'
      })

      const iconSpan = document.createElement('span')
      iconSpan.textContent = model.icon
      iconSpan.style.fontSize = '20px'

      const textContainer = document.createElement('div')
      
      const nameDiv = document.createElement('div')
      nameDiv.textContent = model.name
      Object.assign(nameDiv.style, {
        fontSize: '14px',
        fontWeight: '500',
        color: '#374151',
        marginBottom: '2px'
      })
      
      const descDiv = document.createElement('div')
      descDiv.textContent = model.description
      Object.assign(descDiv.style, {
        fontSize: '12px',
        color: '#6b7280'
      })

      textContainer.appendChild(nameDiv)
      textContainer.appendChild(descDiv)
      content.appendChild(iconSpan)
      content.appendChild(textContainer)
      item.appendChild(content)

      // 이벤트 리스너
      item.addEventListener('mouseenter', () => {
        item.style.backgroundColor = '#f9fafb'
      })

      item.addEventListener('mouseleave', () => {
        item.style.backgroundColor = 'transparent'
      })

      item.addEventListener('click', () => {
        this.handleModelSelect(model.id)
      })

      this.dropdown?.appendChild(item)
    })

    if (this.container) {
      this.container.appendChild(this.dropdown)
    }
  }

  private setupEventListeners(): void {
    const handleClickOutside = (event: MouseEvent) => {
      if (this.container && !this.container.contains(event.target as Node)) {
        this.closeDropdown()
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    this.eventCleanupFunctions.push(() => {
      document.removeEventListener('mousedown', handleClickOutside)
    })
  }

  private toggleDropdown(): void {
    this.isDropdownOpen = !this.isDropdownOpen
    
    if (this.dropdown && this.button) {
      const arrow = this.button.querySelector('[data-arrow="true"]') as HTMLElement
      
      if (this.isDropdownOpen) {
        this.dropdown.style.display = 'block'
        if (arrow) arrow.style.transform = 'rotate(180deg)'
      } else {
        this.dropdown.style.display = 'none'
        if (arrow) arrow.style.transform = 'rotate(0deg)'
      }
    }
  }

  private closeDropdown(): void {
    this.isDropdownOpen = false
    if (this.dropdown) {
      this.dropdown.style.display = 'none'
    }
    if (this.button) {
      const arrow = this.button.querySelector('[data-arrow="true"]') as HTMLElement
      if (arrow) arrow.style.transform = 'rotate(0deg)'
    }
  }

  private handleModelSelect(modelId: string): void {
    if (modelId === 'book') {
      if (this.props.onShowBookCreator) {
        this.props.onShowBookCreator()
      }
    } else {
      this.props.onModelAdd(modelId)
    }
    
    this.closeDropdown()
  }

  public getContainer(): HTMLElement | null {
    return this.container
  }

  public updateProps(newProps: Partial<ModelSelectorProps>): void {
    this.props = { ...this.props, ...newProps }
  }

  public dispose(): void {
    // 이벤트 리스너 정리
    this.eventCleanupFunctions.forEach(cleanup => cleanup())
    this.eventCleanupFunctions = []

    // DOM 요소 제거
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }

    this.container = null
    this.button = null
    this.dropdown = null
  }
} 