import { ROOM_CONTROL_STYLES } from './styles/RoomControlsStyles'
import { availableModels } from '../objects'

export interface ToolsParams {
  // 툴바 관련 파라미터가 필요하면 여기에 추가
  [key: string]: unknown
}

export class ToolsControls {
  private container: HTMLDivElement | null = null
  private params: ToolsParams
  private onParamsChange: (params: Partial<ToolsParams>) => void
  private onModelAdd: (modelType: string) => void
  private onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void
  private showBookCreator: boolean = false
  private bookCreatorModal: HTMLElement | null = null
  private isDropdownOpen: boolean = false
  private dropdownContainer: HTMLElement | null = null

  // 북 크리에이터 상태들
  private selectedImage: File | null = null
  private imageUrl: string = ''
  private thickness: number = 3
  private aspectRatio: number = 1
  private title: string = ''

  constructor(
    params: ToolsParams,
    onParamsChange: (params: Partial<ToolsParams>) => void,
    onModelAdd: (modelType: string) => void,
    onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void,
    appendToDOM: boolean = true
  ) {
    this.params = params
    this.onParamsChange = onParamsChange
    this.onModelAdd = onModelAdd
    this.onBookCreate = onBookCreate
    
    this.createContainer(appendToDOM)
  }

  private createContainer(appendToDOM: boolean = true): void {
    this.container = document.createElement('div')
    Object.assign(this.container.style, ROOM_CONTROL_STYLES.TOOLS_SECTION_CONTAINER)
    
    this.createToolsContent()
    this.setupEventListeners()
    
    if (appendToDOM) {
      document.body.appendChild(this.container)
    }
  }

  private createToolsContent(): void {
    if (!this.container) return

    // 메인 그리드 컨테이너
    const gridContainer = document.createElement('div')
    Object.assign(gridContainer.style, ROOM_CONTROL_STYLES.TOOLS_GRID_CONTAINER)

    // 모델 추가 버튼
    const modelAddButton = this.createModelAddButton()
    gridContainer.appendChild(modelAddButton)

    this.container.appendChild(gridContainer)
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
    this.dropdownContainer = this.createDropdown()
    buttonContainer.appendChild(button)
    buttonContainer.appendChild(this.dropdownContainer)

    // 이벤트 리스너
    button.addEventListener('click', (e) => {
      e.stopPropagation()
      this.toggleDropdown(arrow)
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
        this.handleModelSelect(model.id)
      })

      dropdown.appendChild(item)
    })

    return dropdown
  }

  private toggleDropdown(arrow: HTMLElement): void {
    if (!this.dropdownContainer) return

    this.isDropdownOpen = !this.isDropdownOpen
    
    if (this.isDropdownOpen) {
      this.dropdownContainer.style.display = 'block'
      arrow.style.transform = 'rotate(180deg)'
    } else {
      this.dropdownContainer.style.display = 'none'
      arrow.style.transform = 'rotate(0deg)'
    }
  }

  private handleModelSelect(modelId: string): void {
    if (modelId === 'book') {
      this.showBookCreatorModal()
    } else {
      this.onModelAdd(modelId)
    }
    
    // 드롭다운 닫기
    this.isDropdownOpen = false
    if (this.dropdownContainer) {
      this.dropdownContainer.style.display = 'none'
    }
  }

  private showBookCreatorModal(): void {
    this.showBookCreator = true
    this.createBookCreatorModal()
  }

  private createBookCreatorModal(): void {
    // 모달 오버레이
    this.bookCreatorModal = document.createElement('div')
    Object.assign(this.bookCreatorModal.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_MODAL_OVERLAY)

    // 모달 컨테이너
    const modalContainer = document.createElement('div')
    Object.assign(modalContainer.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_MODAL_CONTAINER)

    // 헤더
    const header = this.createModalHeader()
    modalContainer.appendChild(header)

    // 책 제목 입력
    const titleGroup = this.createTitleInput()
    modalContainer.appendChild(titleGroup)

    // 이미지 업로드
    const imageGroup = this.createImageUpload()
    modalContainer.appendChild(imageGroup)

    // 두께 슬라이더
    const thicknessGroup = this.createThicknessSlider()
    modalContainer.appendChild(thicknessGroup)

    // 버튼들
    const buttons = this.createModalButtons()
    modalContainer.appendChild(buttons)

    this.bookCreatorModal.appendChild(modalContainer)
    document.body.appendChild(this.bookCreatorModal)

    // 외부 클릭시 닫기
    this.bookCreatorModal.addEventListener('click', (e) => {
      if (e.target === this.bookCreatorModal) {
        this.closeBookCreatorModal()
      }
    })
  }

  private createModalHeader(): HTMLElement {
    const header = document.createElement('div')
    Object.assign(header.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_HEADER)

    const title = document.createElement('h2')
    title.textContent = '새 책 만들기'
    Object.assign(title.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_TITLE)

    const closeButton = document.createElement('button')
    closeButton.textContent = '×'
    Object.assign(closeButton.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_CLOSE_BUTTON)

    closeButton.addEventListener('mouseenter', () => {
      Object.assign(closeButton.style, {
        ...ROOM_CONTROL_STYLES.BOOK_CREATOR_CLOSE_BUTTON,
        ...ROOM_CONTROL_STYLES.BOOK_CREATOR_CLOSE_BUTTON_HOVER
      })
    })

    closeButton.addEventListener('mouseleave', () => {
      Object.assign(closeButton.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_CLOSE_BUTTON)
    })

    closeButton.addEventListener('click', () => {
      this.closeBookCreatorModal()
    })

    header.appendChild(title)
    header.appendChild(closeButton)

    return header
  }

  private createTitleInput(): HTMLElement {
    const group = document.createElement('div')
    Object.assign(group.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_INPUT_GROUP)

    const label = document.createElement('label')
    label.textContent = '책 제목'
    Object.assign(label.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_LABEL)

    const input = document.createElement('input')
    input.type = 'text'
    input.placeholder = '책 제목을 입력하세요'
    input.value = this.title
    Object.assign(input.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_INPUT)

    input.addEventListener('input', (e) => {
      this.title = (e.target as HTMLInputElement).value
    })

    group.appendChild(label)
    group.appendChild(input)

    return group
  }

  private createImageUpload(): HTMLElement {
    const group = document.createElement('div')
    Object.assign(group.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_INPUT_GROUP)

    const label = document.createElement('label')
    label.textContent = '책 표지 이미지'
    Object.assign(label.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_LABEL)

    const fileInput = document.createElement('input')
    fileInput.type = 'file'
    fileInput.accept = 'image/*'
    fileInput.style.display = 'none'

    const uploadButton = document.createElement('button')
    uploadButton.textContent = this.selectedImage ? this.selectedImage.name : '이미지 선택하기'
    Object.assign(uploadButton.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_UPLOAD_BUTTON)

    uploadButton.addEventListener('mouseenter', () => {
      Object.assign(uploadButton.style, {
        ...ROOM_CONTROL_STYLES.BOOK_CREATOR_UPLOAD_BUTTON,
        ...ROOM_CONTROL_STYLES.BOOK_CREATOR_UPLOAD_BUTTON_HOVER
      })
    })

    uploadButton.addEventListener('mouseleave', () => {
      Object.assign(uploadButton.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_UPLOAD_BUTTON)
    })

    uploadButton.addEventListener('click', () => {
      fileInput.click()
    })

    fileInput.addEventListener('change', (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        this.selectedImage = file
        if (this.imageUrl) {
          URL.revokeObjectURL(this.imageUrl)
        }
        this.imageUrl = URL.createObjectURL(file)
        uploadButton.textContent = file.name

        // 이미지 비율 계산
        const img = new Image()
        img.onload = () => {
          this.aspectRatio = img.width / img.height
        }
        img.src = this.imageUrl
      }
    })

    group.appendChild(label)
    group.appendChild(uploadButton)
    group.appendChild(fileInput)

    return group
  }

  private createThicknessSlider(): HTMLElement {
    const group = document.createElement('div')
    Object.assign(group.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_INPUT_GROUP)

    const label = document.createElement('label')
    label.textContent = '책 두께'
    Object.assign(label.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_LABEL)

    const sliderContainer = document.createElement('div')
    Object.assign(sliderContainer.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_SLIDER_CONTAINER)

    const slider = document.createElement('input')
    slider.type = 'range'
    slider.min = '1'
    slider.max = '10'
    slider.step = '1'
    slider.value = this.thickness.toString()
    Object.assign(slider.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_SLIDER)

    const valueDisplay = document.createElement('span')
    valueDisplay.textContent = this.thickness.toString()
    Object.assign(valueDisplay.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_SLIDER_VALUE)

    slider.addEventListener('input', (e) => {
      this.thickness = parseInt((e.target as HTMLInputElement).value)
      valueDisplay.textContent = this.thickness.toString()
    })

    sliderContainer.appendChild(slider)
    sliderContainer.appendChild(valueDisplay)

    group.appendChild(label)
    group.appendChild(sliderContainer)

    return group
  }

  private createModalButtons(): HTMLElement {
    const buttonsContainer = document.createElement('div')
    Object.assign(buttonsContainer.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_BUTTONS)

    const cancelButton = document.createElement('button')
    cancelButton.textContent = '취소'
    Object.assign(cancelButton.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_CANCEL_BUTTON)

    cancelButton.addEventListener('mouseenter', () => {
      Object.assign(cancelButton.style, {
        ...ROOM_CONTROL_STYLES.BOOK_CREATOR_CANCEL_BUTTON,
        ...ROOM_CONTROL_STYLES.BOOK_CREATOR_CANCEL_BUTTON_HOVER
      })
    })

    cancelButton.addEventListener('mouseleave', () => {
      Object.assign(cancelButton.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_CANCEL_BUTTON)
    })

    cancelButton.addEventListener('click', () => {
      this.closeBookCreatorModal()
    })

    const createButton = document.createElement('button')
    createButton.textContent = '생성'
    Object.assign(createButton.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_CREATE_BUTTON)

    const updateCreateButton = () => {
      if (this.imageUrl && this.title.trim()) {
        Object.assign(createButton.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_CREATE_BUTTON)
        createButton.disabled = false
      } else {
        Object.assign(createButton.style, {
          ...ROOM_CONTROL_STYLES.BOOK_CREATOR_CREATE_BUTTON,
          ...ROOM_CONTROL_STYLES.BOOK_CREATOR_CREATE_BUTTON_DISABLED
        })
        createButton.disabled = true
      }
    }

    createButton.addEventListener('mouseenter', () => {
      if (!createButton.disabled) {
        Object.assign(createButton.style, {
          ...ROOM_CONTROL_STYLES.BOOK_CREATOR_CREATE_BUTTON,
          ...ROOM_CONTROL_STYLES.BOOK_CREATOR_CREATE_BUTTON_HOVER
        })
      }
    })

    createButton.addEventListener('mouseleave', () => {
      updateCreateButton()
    })

    createButton.addEventListener('click', () => {
      if (this.imageUrl && this.title.trim()) {
        this.onBookCreate(this.imageUrl, this.thickness, this.aspectRatio, this.title.trim())
        this.closeBookCreatorModal()
      }
    })

    updateCreateButton()

    buttonsContainer.appendChild(cancelButton)
    buttonsContainer.appendChild(createButton)

    return buttonsContainer
  }

  private closeBookCreatorModal(): void {
    if (this.bookCreatorModal) {
      document.body.removeChild(this.bookCreatorModal)
      this.bookCreatorModal = null
    }
    
    // 리소스 정리
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl)
      this.imageUrl = ''
    }
    
    this.selectedImage = null
    this.title = ''
    this.thickness = 3
    this.aspectRatio = 1
    this.showBookCreator = false
  }

  private setupEventListeners(): void {
    // 외부 클릭시 드롭다운 닫기
    document.addEventListener('click', (e) => {
      if (this.isDropdownOpen && this.dropdownContainer) {
        if (!this.dropdownContainer.contains(e.target as Node) && 
            !this.container?.contains(e.target as Node)) {
          this.isDropdownOpen = false
          this.dropdownContainer.style.display = 'none'
        }
      }
    })
  }

  // 공개 메서드들
  public getParams(): ToolsParams {
    return this.params
  }

  public updateParams(newParams: Partial<ToolsParams>): void {
    this.params = { ...this.params, ...newParams }
    this.onParamsChange(newParams)
  }

  public getContainer(): HTMLElement | null {
    return this.container
  }

  public dispose(): void {
    if (this.bookCreatorModal) {
      this.closeBookCreatorModal()
    }
    
    if (this.container && this.container.parentNode) {
      this.container.parentNode.removeChild(this.container)
    }
    
    this.container = null
    this.dropdownContainer = null
  }
} 