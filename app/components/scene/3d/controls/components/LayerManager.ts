import { ROOM_CONTROL_STYLES } from '../styles/RoomControlsStyles'
import { BaseModel } from '../../objects/BaseModel'

export interface LayerManagerConfig {
  onModelSelect?: (modelId: string) => void
  onModelDelete?: (modelId: string) => void
  onModelVisibilityToggle?: (modelId: string, visible: boolean) => void
}

export class LayerManager {
  private container: HTMLElement | null = null
  private layersContainer: HTMLElement | null = null
  private models: BaseModel[] = []
  private selectedModelId: string | null = null
  private config: LayerManagerConfig

  constructor(config: LayerManagerConfig = {}) {
    this.config = config
  }

  public create(): HTMLElement {
    // 메인 컨테이너
    this.container = document.createElement('div')
    Object.assign(this.container.style, {
      backgroundColor: '#C0C0C0',
      border: '2px inset #C0C0C0',
      borderRadius: '2px',
      marginBottom: '8px',
      fontSize: '11px',
      fontFamily: '"W95FA", "MS Sans Serif", sans-serif'
    })

    // 헤더
    const header = this.createHeader()
    this.container.appendChild(header)

    // 레이어 목록 컨테이너
    this.layersContainer = document.createElement('div')
    Object.assign(this.layersContainer.style, {
      maxHeight: '200px',
      overflowY: 'auto',
      backgroundColor: '#FFFFFF',
      border: '1px inset #C0C0C0',
      margin: '4px'
    })

    this.container.appendChild(this.layersContainer)
    
    return this.container
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div')
    Object.assign(header.style, {
      padding: '6px 8px',
      backgroundColor: '#C0C0C0',
      borderBottom: '1px solid #808080',
      fontWeight: 'bold',
      fontSize: '11px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    })

    const title = document.createElement('span')
    title.textContent = '📋 레이어'

    const modelCount = document.createElement('span')
    modelCount.textContent = `(${this.models.length})`
    modelCount.style.color = '#666666'

    header.appendChild(title)
    header.appendChild(modelCount)

    return header
  }

  public updateModels(models: BaseModel[]): void {
    this.models = [...models]
    this.renderLayers()
    this.updateModelCount()
  }

  private renderLayers(): void {
    if (!this.layersContainer) return

    // 기존 레이어 제거
    this.layersContainer.innerHTML = ''

    if (this.models.length === 0) {
      const emptyMessage = document.createElement('div')
      Object.assign(emptyMessage.style, {
        padding: '20px',
        textAlign: 'center',
        color: '#666666',
        fontStyle: 'italic'
      })
      emptyMessage.textContent = '추가된 모델이 없습니다'
      this.layersContainer.appendChild(emptyMessage)
      return
    }

    // 모델별 레이어 항목 생성 (최신 순으로 정렬)
    const sortedModels = [...this.models].reverse()
    sortedModels.forEach((model, index) => {
      const layerItem = this.createLayerItem(model, index)
      if (this.layersContainer) {
        this.layersContainer.appendChild(layerItem)
      }
    })
  }

  private createLayerItem(model: BaseModel, index: number): HTMLElement {
    const item = document.createElement('div')
    const isSelected = this.selectedModelId === model.getId()
    
    Object.assign(item.style, {
      display: 'flex',
      alignItems: 'center',
      padding: '4px 6px',
      borderBottom: '1px solid #E0E0E0',
      cursor: 'pointer',
      backgroundColor: isSelected ? '#0078D4' : '#FFFFFF',
      color: isSelected ? '#FFFFFF' : '#000000'
    })

    // 가시성 토글 아이콘 (눈 모양)
    const visibilityIcon = document.createElement('span')
    visibilityIcon.textContent = '👁️'
    Object.assign(visibilityIcon.style, {
      cursor: 'pointer',
      marginRight: '6px',
      fontSize: '12px',
      opacity: model.isVisible() ? '1' : '0.3'
    })

    // 모델 타입 아이콘
    const typeIcon = document.createElement('span')
    typeIcon.textContent = this.getModelIcon(model)
    Object.assign(typeIcon.style, {
      marginRight: '6px',
      fontSize: '14px'
    })

    // 모델 이름
    const nameContainer = document.createElement('div')
    Object.assign(nameContainer.style, {
      flex: '1',
      minWidth: '0'
    })

    const name = document.createElement('div')
    name.textContent = this.getModelDisplayName(model)
    Object.assign(name.style, {
      fontWeight: 'normal',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    })

    const details = document.createElement('div')
    details.textContent = `ID: ${model.getId()}`
    Object.assign(details.style, {
      fontSize: '9px',
      opacity: '0.7',
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis'
    })

    nameContainer.appendChild(name)
    nameContainer.appendChild(details)

    // 삭제 버튼
    const deleteButton = document.createElement('span')
    deleteButton.textContent = '🗑️'
    Object.assign(deleteButton.style, {
      cursor: 'pointer',
      marginLeft: '6px',
      fontSize: '12px',
      opacity: '0.6',
      padding: '2px'
    })

    // 이벤트 리스너
    visibilityIcon.addEventListener('click', (e) => {
      e.stopPropagation()
      const newVisibility = !model.isVisible()
      model.setVisible(newVisibility)
      visibilityIcon.style.opacity = newVisibility ? '1' : '0.3'
      this.config.onModelVisibilityToggle?.(model.getId(), newVisibility)
    })

    item.addEventListener('click', () => {
      this.selectModel(model.getId())
      this.config.onModelSelect?.(model.getId())
    })

    deleteButton.addEventListener('click', (e) => {
      e.stopPropagation()
      if (confirm(`"${this.getModelDisplayName(model)}" 모델을 삭제하시겠습니까?`)) {
        this.config.onModelDelete?.(model.getId())
      }
    })

    deleteButton.addEventListener('mouseenter', () => {
      deleteButton.style.opacity = '1'
      deleteButton.style.backgroundColor = '#FF4444'
      deleteButton.style.borderRadius = '2px'
    })

    deleteButton.addEventListener('mouseleave', () => {
      deleteButton.style.opacity = '0.6'
      deleteButton.style.backgroundColor = 'transparent'
    })

    item.appendChild(visibilityIcon)
    item.appendChild(typeIcon)
    item.appendChild(nameContainer)
    item.appendChild(deleteButton)

    return item
  }

  private getModelIcon(model: BaseModel): string {
    const modelType = model.getType()
    const iconMap: { [key: string]: string } = {
      'chair': '🪑',
      'stool': '🪑',
      'book': '📚',
      'table': '🪑',
      'shelf': '📚',
      'lamp': '💡'
    }
    return iconMap[modelType] || '📦'
  }

  private getModelDisplayName(model: BaseModel): string {
    const modelType = model.getType()
    const nameMap: { [key: string]: string } = {
      'chair': '의자',
      'stool': '스툴',
      'book': '책',
      'table': '테이블',
      'shelf': '선반',
      'lamp': '조명'
    }
    return nameMap[modelType] || modelType
  }

  public selectModel(modelId: string | null): void {
    this.selectedModelId = modelId
    this.renderLayers()
  }

  private updateModelCount(): void {
    if (!this.container) return
    
    const header = this.container.querySelector('div')
    if (!header) return
    
    const countSpan = header.querySelector('span:last-child')
    if (!countSpan) return
    
    countSpan.textContent = `(${this.models.length})`
  }

  public dispose(): void {
    this.container = null
    this.layersContainer = null
    this.models = []
    this.selectedModelId = null
  }
} 