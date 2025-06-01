import * as THREE from 'three'
import { BaseModel, ModelPosition, ModelScale, ModelRotation } from './BaseModel'

export interface BookConfig {
  imageUrl: string
  thickness: number // 1-5
  aspectRatio: number // width/height
  title: string
}

export class Book extends BaseModel {
  private config: BookConfig
  private bookMesh!: THREE.Mesh

  constructor(
    config: BookConfig,
    position: ModelPosition = { x: 0, y: 0, z: 0 },
    scale: ModelScale = { x: 1, y: 1, z: 1 },
    rotation: ModelRotation = { x: 0, y: 0, z: 0 }
  ) {
    // BaseModel은 modelPath를 요구하지만 책은 동적으로 생성하므로 빈 문자열 전달
    super('', position, scale, rotation)
    this.config = config
  }

  public async load(): Promise<void> {
    try {
      await this.createBookModel()
      this.applyTransforms()
      this.createBookCollider()
      this.isLoaded = true
      
      console.log(`Book loaded successfully at position (${this.position.x}, ${this.position.y}, ${this.position.z})`)
    } catch (error) {
      console.error('Failed to load Book:', error)
      throw error
    }
  }

  private extractDominantColor(texture: THREE.Texture): THREE.Color {
    // 캔버스를 생성하여 이미지 데이터 추출
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx || !texture.image) {
      return new THREE.Color(0x8B4513) // 기본 갈색
    }

    // 이미지 크기 설정 (성능을 위해 작은 크기로)
    const size = 50
    canvas.width = size
    canvas.height = size
    
    // 이미지를 캔버스에 그리기
    ctx.drawImage(texture.image, 0, 0, size, size)
    
    try {
      // 이미지 데이터 추출
      const imageData = ctx.getImageData(0, 0, size, size)
      const data = imageData.data
      
      // 색상 빈도 계산
      const colorMap = new Map<string, number>()
      
      for (let i = 0; i < data.length; i += 4) {
        const r = Math.floor(data[i] / 32) * 32 // 색상 그룹화
        const g = Math.floor(data[i + 1] / 32) * 32
        const b = Math.floor(data[i + 2] / 32) * 32
        const alpha = data[i + 3]
        
        // 투명하거나 너무 밝은/어두운 색상 제외
        if (alpha < 128 || (r + g + b) < 50 || (r + g + b) > 650) continue
        
        const colorKey = `${r},${g},${b}`
        colorMap.set(colorKey, (colorMap.get(colorKey) || 0) + 1)
      }
      
      // 가장 빈도가 높은 색상 찾기
      let maxCount = 0
      let dominantColor = '139,69,19' // 기본 갈색
      
      for (const [color, count] of colorMap) {
        if (count > maxCount) {
          maxCount = count
          dominantColor = color
        }
      }
      
      const [r, g, b] = dominantColor.split(',').map(Number)
      return new THREE.Color(r / 255, g / 255, b / 255)
      
    } catch (error) {
      console.warn('Failed to extract color from image:', error)
      return new THREE.Color(0x8B4513) // 기본 갈색
    }
  }

  private createTextTexture(text: string, backgroundColor: THREE.Color): THREE.Texture {
    // 캔버스 생성
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    if (!ctx) {
      throw new Error('Canvas context not available')
    }

    // 캔버스 크기 설정
    canvas.width = 256
    canvas.height = 50
    
    // 배경색 설정
    ctx.fillStyle = `rgb(${Math.floor(backgroundColor.r * 255)}, ${Math.floor(backgroundColor.g * 255)}, ${Math.floor(backgroundColor.b * 255)})`
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // 텍스트 스타일 설정
    ctx.fillStyle = 'white'
    ctx.font = 'bold 24px Arial, sans-serif'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    
    // 긴 제목의 경우 줄바꿈 처리
    const words = text.split(' ')
    const lines: string[] = []
    let currentLine = ''
    
    for (const word of words) {
      const testLine = currentLine + (currentLine ? ' ' : '') + word
      const metrics = ctx.measureText(testLine)
      
      if (metrics.width > canvas.width - 40 && currentLine) {
        lines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) {
      lines.push(currentLine)
    }
    
    // 텍스트 그리기
    const lineHeight = 30
    const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2
    
    lines.forEach((line, index) => {
      ctx.fillText(line, canvas.width / 2, startY + index * lineHeight)
    })
    
    // 텍스처 생성
    const texture = new THREE.CanvasTexture(canvas)
    texture.needsUpdate = true
    
    return texture
  }

  private async createBookModel(): Promise<void> {
    // 이미지 텍스처 로드
    const textureLoader = new THREE.TextureLoader()
    const texture = await new Promise<THREE.Texture>((resolve, reject) => {
      textureLoader.load(
        this.config.imageUrl,
        (loadedTexture) => {
          // 이미지가 완전히 로드된 후 색상 추출
          if (loadedTexture.image && loadedTexture.image.complete) {
            resolve(loadedTexture)
          } else {
            loadedTexture.image.onload = () => resolve(loadedTexture)
          }
        },
        undefined,
        reject
      )
    })

    // 이미지에서 주요 색상 추출
    const dominantColor = this.extractDominantColor(texture)
    
    // 제목 텍스처 생성
    const titleTexture = this.createTextTexture(this.config.title, dominantColor)
    
    // 책 크기 계산 (기존 크기의 절반으로 변경)
    const width = 0.3 // 기준 크기를 1에서 0.5로 변경
    const height = width / this.config.aspectRatio
    const depth = this.config.thickness * 0.03 // 두께도 절반으로 (0.1에서 0.05로)

    // 책 지오메트리 생성
    const geometry = new THREE.BoxGeometry(width, depth, height)

    // 재질 배열 생성 (각 면마다 다른 재질)
    const materials = [
      new THREE.MeshLambertMaterial({ map: titleTexture }), // 오른쪽 면 (제목 텍스처)
      new THREE.MeshLambertMaterial({ color: 0xffffff }), // 왼쪽 면 (흰색)
      new THREE.MeshLambertMaterial({ map: texture }), // 윗면 (이미지 텍스처)
      new THREE.MeshLambertMaterial({ color: 0xffffff }), // 아래면 (흰색)
      new THREE.MeshLambertMaterial({ color: 0xffffff }), // 앞면 (흰색)
      new THREE.MeshLambertMaterial({ color: 0xffffff }), // 뒷면 (흰색으로 변경)
    ]

    // 메시 생성
    this.bookMesh = new THREE.Mesh(geometry, materials)
    
    // 그룹 생성 및 메시 추가
    this.model = new THREE.Group()
    this.model.add(this.bookMesh)

    // 책의 바닥면이 Y=0에 오도록 위치 조정
    // BoxGeometry는 중심이 원점이므로, 책의 바닥이 Y=0에 오려면 depth/2만큼 위로 올려야 함
    this.bookMesh.position.y = depth / 2
  }

  private createBookCollider(): void {
    if (!this.bookMesh) return

    // 책 메시의 지오메트리를 복제하여 콜라이더 생성
    const colliderGeometry = this.bookMesh.geometry.clone()
    
    const colliderMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      color: 0x00ff00,
      visible: true,
      wireframe: false
    })
    
    this.collider = new THREE.Mesh(colliderGeometry, colliderMaterial)
    
    // 원본 메시의 위치 복사
    this.collider.position.copy(this.bookMesh.position)
    this.collider.rotation.copy(this.bookMesh.rotation)
    this.collider.scale.copy(this.bookMesh.scale)
    
    // 콜라이더 식별 정보 추가
    this.collider.userData.modelId = this.id
    this.collider.userData.isCollider = true
    
    this.model.add(this.collider)
    
    console.log(`Book collider created for ${this.id}`)
  }

  protected setupModel(): void {
    // 책은 동적으로 생성되므로 별도 설정 불필요
  }

  public update(): void {
    // 책은 정적 객체이므로 업데이트 로직 불필요
  }

  public getConfig(): BookConfig {
    return { ...this.config }
  }
}

// 모델 메타데이터
export const modelMetadata = {
  id: 'book',
  name: '책',
  description: '이미지와 두께를 설정할 수 있는 책',
  icon: '📚',
  modelClass: Book
} 