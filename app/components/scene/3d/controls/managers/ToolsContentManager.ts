import { ROOM_CONTROL_STYLES } from '../styles/RoomControlsStyles'
import { availableModels } from '../../objects'
import { BookCreator } from '../components/BookCreator'
import { LayerManager, LayerManagerConfig } from '../components/LayerManager'
import { BaseModel } from '../../objects/BaseModel'

export class ToolsContentManager {
  private onModelAdd: (modelType: string) => void
  private onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void
  private onModelDelete?: (modelId: string) => void
  private getModels?: () => BaseModel[]
  private bookCreator: BookCreator | null = null
  private layerManager: LayerManager | null = null

  constructor(
    onModelAdd: (modelType: string) => void,
    onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void,
    onModelDelete?: (modelId: string) => void,
    getModels?: () => BaseModel[]
  ) {
    this.onModelAdd = onModelAdd
    this.onBookCreate = onBookCreate
    this.onModelDelete = onModelDelete
    this.getModels = getModels
    
    // BookCreator 초기화
    this.bookCreator = new BookCreator({
      onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => {
        this.onBookCreate(imageUrl, thickness, aspectRatio, title)
      },
      onClose: () => {
        // 모달 닫기 시 추가 로직이 필요하면 여기에
      }
    })

    // LayerManager 초기화
    const layerConfig: LayerManagerConfig = {
      onModelDelete: (modelId: string) => {
        this.onModelDelete?.(modelId)
        this.updateLayerModels() // 모델 삭제 후 레이어 업데이트
      },
      onModelSelect: (modelId: string) => {
        console.log(`Model selected: ${modelId}`)
        // 여기에 모델 선택 로직 추가 가능
      },
      onModelVisibilityToggle: (modelId: string, visible: boolean) => {
        console.log(`Model ${modelId} visibility toggled: ${visible}`)
        // 가시성 변경 로직은 LayerManager 내부에서 처리됨
      }
    }
    
    this.layerManager = new LayerManager(layerConfig)
  }

  public createContent(): HTMLElement {
    const content = document.createElement('div')
    Object.assign(content.style, {
      backgroundColor: ROOM_CONTROL_STYLES.PANEL_CONTENT.background,
      padding: '10px',
      overflow: 'visible' // 드롭다운이 패널 밖으로 나올 수 있도록 함
    })

    // 레이어 매니저 섹션 추가
    if (this.layerManager) {
      const layerContainer = this.layerManager.create()
      content.appendChild(layerContainer)
      this.updateLayerModels() // 초기 모델 목록 업데이트
    }

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
    arrow.textContent = '▲'
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
      display: 'none',
      top: 'auto',
      bottom: '100%',
      borderTop: '2px solid #000000',
      borderBottom: 'none',
      zIndex: '9999' // 드롭다운이 다른 요소들 위에 나타나도록 높은 z-index 설정
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
    this.layerManager?.dispose()
    this.layerManager = null
  }

  // 레이어 모델 목록 업데이트
  public updateLayerModels(): void {
    if (this.layerManager && this.getModels) {
      const models = this.getModels()
      this.layerManager.updateModels(models)
    }
  }
} 