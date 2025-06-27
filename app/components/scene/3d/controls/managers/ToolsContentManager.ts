import { ROOM_CONTROL_STYLES } from '../styles/RoomControlsStyles'
import { availableModels } from '../../objects'
import { BookCreator } from '../components/BookCreator'

export class ToolsContentManager {
  private onModelAdd: (modelType: string) => void
  private onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void
  private bookCreator: BookCreator | null = null

  constructor(
    onModelAdd: (modelType: string) => void,
    onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void
  ) {
    this.onModelAdd = onModelAdd
    this.onBookCreate = onBookCreate
    
    // BookCreator 초기화
    this.bookCreator = new BookCreator({
      onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => {
        this.onBookCreate(imageUrl, thickness, aspectRatio, title)
      },
      onClose: () => {
        // 모달 닫기 시 추가 로직이 필요하면 여기에
      }
    })
  }

  public createContent(): HTMLElement {
    const content = document.createElement('div')
    Object.assign(content.style, {
      backgroundColor: ROOM_CONTROL_STYLES.PANEL_CONTENT.background,
      padding: '10px',
      overflow: 'visible' // 드롭다운이 패널 밖으로 나올 수 있도록 함
    })

    // 메인 그리드 컨테이너
    const gridContainer = document.createElement('div')
    Object.assign(gridContainer.style, {
      ...ROOM_CONTROL_STYLES.TOOLS_GRID_CONTAINER,
      overflow: 'visible' // 그리드 컨테이너도 overflow visible로 설정
    })

    // 모델 추가 버튼
    const modelAddButton = this.createModelAddButton()
    gridContainer.appendChild(modelAddButton)

    content.appendChild(gridContainer)
    return content
  }

  private createModelAddButton(): HTMLElement {
    const buttonContainer = document.createElement('div')
    buttonContainer.style.position = 'relative'

    const button = document.createElement('button')
    Object.assign(button.style, ROOM_CONTROL_STYLES.MODEL_ADD_BUTTON)

    // 버튼 내용
    const icon = document.createElement('span')
    icon.textContent = '📦'
    
    const text = document.createElement('span')
    text.textContent = '모델 추가'
    
    const arrow = document.createElement('span')
    arrow.textContent = '▼'
    arrow.style.transition = 'transform 0.2s'

    button.appendChild(icon)
    button.appendChild(text)
    button.appendChild(arrow)

    // 드롭다운 컨테이너 생성
    const dropdownContainer = this.createDropdown()
    buttonContainer.appendChild(button)
    buttonContainer.appendChild(dropdownContainer)

    // 이벤트 리스너
    button.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleDropdown(dropdownContainer, arrow)
    })

    button.addEventListener('mouseenter', () => {
      Object.assign(button.style, {
        ...ROOM_CONTROL_STYLES.MODEL_ADD_BUTTON,
        ...ROOM_CONTROL_STYLES.MODEL_ADD_BUTTON_HOVER
      })
    })

    button.addEventListener('mouseleave', () => {
      Object.assign(button.style, ROOM_CONTROL_STYLES.MODEL_ADD_BUTTON)
    })

    return buttonContainer
  }

  private createDropdown(): HTMLElement {
    const dropdown = document.createElement('div')
    Object.assign(dropdown.style, {
      ...ROOM_CONTROL_STYLES.MODEL_DROPDOWN_CONTAINER,
      display: 'none'
    })

    const models = availableModels

    models.forEach((model) => {
      const item = document.createElement('button')
      Object.assign(item.style, ROOM_CONTROL_STYLES.MODEL_DROPDOWN_ITEM)

      const iconSpan = document.createElement('span')
      iconSpan.textContent = model.icon
      Object.assign(iconSpan.style, ROOM_CONTROL_STYLES.MODEL_DROPDOWN_ITEM_ICON)

      const textContainer = document.createElement('div')
      Object.assign(textContainer.style, ROOM_CONTROL_STYLES.MODEL_DROPDOWN_ITEM_TEXT)

      const nameDiv = document.createElement('div')
      nameDiv.textContent = model.name
      
      const descDiv = document.createElement('div')
      descDiv.textContent = model.description
      Object.assign(descDiv.style, ROOM_CONTROL_STYLES.MODEL_DROPDOWN_ITEM_DESC)

      textContainer.appendChild(nameDiv)
      textContainer.appendChild(descDiv)

      item.appendChild(iconSpan)
      item.appendChild(textContainer)

      // 이벤트 리스너
      item.addEventListener('mouseenter', () => {
        Object.assign(item.style, {
          ...ROOM_CONTROL_STYLES.MODEL_DROPDOWN_ITEM,
          ...ROOM_CONTROL_STYLES.MODEL_DROPDOWN_ITEM_HOVER
        })
      })

      item.addEventListener('mouseleave', () => {
        Object.assign(item.style, ROOM_CONTROL_STYLES.MODEL_DROPDOWN_ITEM)
      })

      item.addEventListener('click', () => {
        this.handleModelSelect(model.id, dropdown)
      })

      dropdown.appendChild(item)
    })

    return dropdown
  }

  private toggleDropdown(dropdownContainer: HTMLElement, arrow: HTMLElement): void {
    const isOpen = dropdownContainer.style.display === 'block'
    
    if (isOpen) {
      dropdownContainer.style.display = 'none'
      arrow.style.transform = 'rotate(0deg)'
    } else {
      dropdownContainer.style.display = 'block'
      arrow.style.transform = 'rotate(180deg)'
    }
  }

  private handleModelSelect(modelId: string, dropdownContainer: HTMLElement, arrow?: HTMLElement): void {
    if (modelId === 'book') {
      // BookCreator 모달 띄우기
      this.bookCreator?.show()
    } else {
      this.onModelAdd(modelId)
    }
    
    // 드롭다운 닫기
    dropdownContainer.style.display = 'none'
    if (arrow) {
      arrow.style.transform = 'rotate(0deg)'
    }
  }

  public dispose(): void {
    this.bookCreator?.dispose()
    this.bookCreator = null
  }
} 