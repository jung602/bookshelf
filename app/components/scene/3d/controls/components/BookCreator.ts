import { ROOM_CONTROL_STYLES } from '../styles/RoomControlsStyles'

export interface BookCreatorConfig {
  onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void
  onClose: () => void
}

export class BookCreator {
  private modal: HTMLElement | null = null
  private selectedImage: File | null = null
  private imageUrl: string = ''
  private thickness: number = 3
  private aspectRatio: number = 1
  private title: string = ''
  private config: BookCreatorConfig

  constructor(config: BookCreatorConfig) {
    this.config = config
  }

  public show(): void {
    this.createModal()
  }

  public hide(): void {
    this.closeModal()
  }

  private createModal(): void {
    // 모달 오버레이
    this.modal = document.createElement('div')
    Object.assign(this.modal.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_MODAL_OVERLAY)

    // 모달 컨테이너
    const modalContainer = document.createElement('div')
    Object.assign(modalContainer.style, ROOM_CONTROL_STYLES.BOOK_CREATOR_MODAL_CONTAINER)

    // 헤더
    const header = this.createHeader()
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
    const buttons = this.createButtons()
    modalContainer.appendChild(buttons)

    this.modal.appendChild(modalContainer)
    document.body.appendChild(this.modal)

    // 외부 클릭시 닫기
    this.modal.addEventListener('click', (e) => {
      if (e.target === this.modal) {
        this.closeModal()
      }
    })
  }

  private createHeader(): HTMLElement {
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
      this.closeModal()
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

  private createButtons(): HTMLElement {
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
      this.closeModal()
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
        this.config.onBookCreate(this.imageUrl, this.thickness, this.aspectRatio, this.title.trim())
        this.closeModal()
      }
    })

    // 초기 버튼 상태 설정
    updateCreateButton()

    buttonsContainer.appendChild(cancelButton)
    buttonsContainer.appendChild(createButton)

    return buttonsContainer
  }

  private closeModal(): void {
    if (this.modal) {
      document.body.removeChild(this.modal)
      this.modal = null
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

    // 콜백 호출
    this.config.onClose()
  }

  public dispose(): void {
    this.closeModal()
  }
} 