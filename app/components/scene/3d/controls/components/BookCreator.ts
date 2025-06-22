interface BookCreatorProps {
  onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void
  onClose: () => void
}

export class BookCreator {
  private container: HTMLDivElement | null = null
  private backdrop: HTMLDivElement | null = null
  private modal: HTMLDivElement | null = null
  private selectedImage: File | null = null
  private imageUrl: string = ''
  private thickness: number = 3
  private aspectRatio: number = 1
  private title: string = ''
  private fileInput: HTMLInputElement | null = null
  private titleInput: HTMLInputElement | null = null
  private thicknessSlider: HTMLInputElement | null = null
  private createButton: HTMLButtonElement | null = null
  private props: BookCreatorProps

  constructor(props: BookCreatorProps) {
    this.props = props
    this.createContainer()
  }

  private createContainer(): void {
    // 배경
    this.backdrop = document.createElement('div')
    Object.assign(this.backdrop.style, {
      position: 'fixed',
      top: '0',
      left: '0',
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '1000'
    })

    // 모달
    this.modal = document.createElement('div')
    Object.assign(this.modal.style, {
      backgroundColor: 'white',
      borderRadius: '12px',
      padding: '24px',
      width: '400px',
      maxWidth: '90vw',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
    })

    this.createModalContent()
    this.backdrop.appendChild(this.modal)
    document.body.appendChild(this.backdrop)
  }

  private createModalContent(): void {
    if (!this.modal) return

    // 헤더
    const header = this.createHeader()
    this.modal.appendChild(header)

    // 책 제목 입력
    const titleSection = this.createTitleInput()
    this.modal.appendChild(titleSection)

    // 이미지 업로드
    const imageSection = this.createImageUpload()
    this.modal.appendChild(imageSection)

    // 두께 슬라이더
    const thicknessSection = this.createThicknessSlider()
    this.modal.appendChild(thicknessSection)

    // 버튼들
    const buttons = this.createButtons()
    this.modal.appendChild(buttons)
  }

  private createHeader(): HTMLElement {
    const header = document.createElement('div')
    Object.assign(header.style, {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '24px'
    })

    const title = document.createElement('h2')
    title.textContent = '새 책 만들기'
    Object.assign(title.style, {
      fontSize: '20px',
      fontWeight: '600',
      color: '#111827',
      margin: '0'
    })

    const closeButton = document.createElement('button')
    closeButton.textContent = '✕'
    Object.assign(closeButton.style, {
      padding: '8px',
      border: 'none',
      background: 'none',
      fontSize: '20px',
      cursor: 'pointer',
      color: '#6b7280',
      borderRadius: '4px'
    })

    closeButton.addEventListener('mouseenter', () => {
      closeButton.style.backgroundColor = '#f3f4f6'
    })

    closeButton.addEventListener('mouseleave', () => {
      closeButton.style.backgroundColor = 'transparent'
    })

    closeButton.addEventListener('click', () => {
      this.handleCancel()
    })

    header.appendChild(title)
    header.appendChild(closeButton)
    return header
  }

  private createTitleInput(): HTMLElement {
    const section = document.createElement('div')
    section.style.marginBottom = '20px'

    const label = document.createElement('label')
    label.textContent = '책 제목'
    Object.assign(label.style, {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px'
    })

    this.titleInput = document.createElement('input')
    this.titleInput.type = 'text'
    this.titleInput.placeholder = '책 제목을 입력하세요'
    Object.assign(this.titleInput.style, {
      width: '100%',
      padding: '10px 12px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      fontSize: '14px',
      outline: 'none',
      transition: 'border-color 0.2s',
      boxSizing: 'border-box'
    })

    this.titleInput.addEventListener('focus', () => {
      if (this.titleInput) this.titleInput.style.borderColor = '#3b82f6'
    })

    this.titleInput.addEventListener('blur', () => {
      if (this.titleInput) this.titleInput.style.borderColor = '#d1d5db'
    })

    this.titleInput.addEventListener('input', () => {
      if (this.titleInput) {
        this.title = this.titleInput.value
        this.updateCreateButton()
      }
    })

    section.appendChild(label)
    section.appendChild(this.titleInput)
    return section
  }

  private createImageUpload(): HTMLElement {
    const section = document.createElement('div')
    section.style.marginBottom = '20px'

    const label = document.createElement('label')
    label.textContent = '책 표지 이미지'
    Object.assign(label.style, {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px'
    })

    // 숨겨진 파일 인풋
    this.fileInput = document.createElement('input')
    this.fileInput.type = 'file'
    this.fileInput.accept = 'image/*'
    this.fileInput.style.display = 'none'
    this.fileInput.addEventListener('change', (e) => this.handleImageUpload(e))

    // 업로드 버튼
    const uploadButton = document.createElement('button')
    uploadButton.textContent = '이미지 선택하기'
    Object.assign(uploadButton.style, {
      width: '100%',
      padding: '12px',
      border: '2px dashed #d1d5db',
      borderRadius: '8px',
      backgroundColor: '#f9fafb',
      cursor: 'pointer',
      transition: 'all 0.2s',
      fontSize: '14px',
      color: '#6b7280'
    })

    uploadButton.addEventListener('mouseenter', () => {
      uploadButton.style.borderColor = '#3b82f6'
      uploadButton.style.backgroundColor = '#eff6ff'
    })

    uploadButton.addEventListener('mouseleave', () => {
      uploadButton.style.borderColor = '#d1d5db'
      uploadButton.style.backgroundColor = '#f9fafb'
    })

    uploadButton.addEventListener('click', () => {
      this.fileInput?.click()
    })

    // 이미지 미리보기 컨테이너
    const previewContainer = document.createElement('div')
    previewContainer.style.marginTop = '12px'
    previewContainer.style.textAlign = 'center'
    previewContainer.style.display = 'none'

    section.appendChild(label)
    section.appendChild(this.fileInput)
    section.appendChild(uploadButton)
    section.appendChild(previewContainer)
    return section
  }

  private createThicknessSlider(): HTMLElement {
    const section = document.createElement('div')
    section.style.marginBottom = '20px'

    const label = document.createElement('label')
    label.textContent = `책 두께: ${this.thickness}cm`
    Object.assign(label.style, {
      display: 'block',
      fontSize: '14px',
      fontWeight: '500',
      color: '#374151',
      marginBottom: '8px'
    })

    this.thicknessSlider = document.createElement('input')
    this.thicknessSlider.type = 'range'
    this.thicknessSlider.min = '1'
    this.thicknessSlider.max = '10'
    this.thicknessSlider.step = '0.5'
    this.thicknessSlider.value = this.thickness.toString()
    Object.assign(this.thicknessSlider.style, {
      width: '100%',
      cursor: 'pointer'
    })

    this.thicknessSlider.addEventListener('input', () => {
      if (this.thicknessSlider) {
        this.thickness = parseFloat(this.thicknessSlider.value)
        label.textContent = `책 두께: ${this.thickness}cm`
      }
    })

    section.appendChild(label)
    section.appendChild(this.thicknessSlider)
    return section
  }

  private createButtons(): HTMLElement {
    const buttonContainer = document.createElement('div')
    Object.assign(buttonContainer.style, {
      display: 'flex',
      gap: '12px',
      justifyContent: 'flex-end'
    })

    // 취소 버튼
    const cancelButton = document.createElement('button')
    cancelButton.textContent = '취소'
    Object.assign(cancelButton.style, {
      padding: '10px 20px',
      border: '1px solid #d1d5db',
      borderRadius: '6px',
      backgroundColor: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      color: '#374151'
    })

    cancelButton.addEventListener('click', () => {
      this.handleCancel()
    })

    // 생성 버튼
    this.createButton = document.createElement('button')
    this.createButton.textContent = '생성'
    Object.assign(this.createButton.style, {
      padding: '10px 20px',
      border: 'none',
      borderRadius: '6px',
      backgroundColor: '#3b82f6',
      color: 'white',
      cursor: 'pointer',
      fontSize: '14px',
      opacity: '0.5'
    })
    this.createButton.disabled = true

    this.createButton.addEventListener('click', () => {
      this.handleCreate()
    })

    buttonContainer.appendChild(cancelButton)
    buttonContainer.appendChild(this.createButton)
    return buttonContainer
  }

  private handleImageUpload(event: Event): void {
    const target = event.target as HTMLInputElement
    const file = target.files?.[0]
    if (file) {
      this.selectedImage = file
      if (this.imageUrl) {
        URL.revokeObjectURL(this.imageUrl)
      }
      this.imageUrl = URL.createObjectURL(file)
      
      // 버튼 텍스트 업데이트
      const uploadButton = this.modal?.querySelector('button')
      if (uploadButton) {
        uploadButton.textContent = file.name
      }
      
      // 이미지 로드해서 비율 계산
      const img = new window.Image()
      img.onload = () => {
        this.aspectRatio = img.width / img.height
        this.updateCreateButton()
      }
      img.src = this.imageUrl
    }
  }

  private updateCreateButton(): void {
    if (!this.createButton) return
    
    const canCreate = this.imageUrl && this.title.trim()
    this.createButton.disabled = !canCreate
    this.createButton.style.opacity = canCreate ? '1' : '0.5'
    this.createButton.style.cursor = canCreate ? 'pointer' : 'not-allowed'
  }

  private handleCreate(): void {
    if (this.imageUrl && this.title.trim()) {
      this.props.onBookCreate(this.imageUrl, this.thickness, this.aspectRatio, this.title.trim())
      this.dispose()
    }
  }

  private handleCancel(): void {
    this.props.onClose()
    this.dispose()
  }

  public dispose(): void {
    if (this.imageUrl) {
      URL.revokeObjectURL(this.imageUrl)
    }
    
    if (this.backdrop && this.backdrop.parentNode) {
      this.backdrop.parentNode.removeChild(this.backdrop)
    }
    
    this.container = null
    this.backdrop = null
    this.modal = null
    this.selectedImage = null
    this.imageUrl = ''
    this.fileInput = null
    this.titleInput = null
    this.thicknessSlider = null
    this.createButton = null
  }
} 