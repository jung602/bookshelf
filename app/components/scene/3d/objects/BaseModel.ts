import * as THREE from 'three'
import { loadGLBModel } from '../scenes/loadGLBModel'

export interface ModelPosition {
  x: number
  y: number
  z: number
}

export interface ModelScale {
  x: number
  y: number
  z: number
}

export interface ModelRotation {
  x: number
  y: number
  z: number
}

export abstract class BaseModel {
  protected model!: THREE.Group
  protected modelPath: string
  protected position: ModelPosition
  protected scale: ModelScale
  protected rotation: ModelRotation
  protected isLoaded: boolean = false
  protected id: string
  protected collider!: THREE.Mesh // 간단한 박스 콜라이더

  constructor(
    modelPath: string,
    position: ModelPosition = { x: 0, y: 0, z: 0 },
    scale: ModelScale = { x: 1, y: 1, z: 1 },
    rotation: ModelRotation = { x: 0, y: 0, z: 0 }
  ) {
    this.modelPath = modelPath
    this.position = position
    this.scale = scale
    this.rotation = rotation
    this.id = this.generateId()
  }

  private generateId(): string {
    return `model_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  public async load(): Promise<void> {
    try {
      const basePath = process.env.NODE_ENV === 'production' ? '/bookshelf' : ''
      this.model = await loadGLBModel(`${basePath}${this.modelPath}`)
      
      this.applyTransforms()
      this.createCollider()
      this.isLoaded = true
      
      console.log(`${this.constructor.name} loaded successfully at position (${this.position.x}, ${this.position.y}, ${this.position.z})`)
    } catch (error) {
      console.error(`Failed to load ${this.constructor.name}:`, error)
      throw error
    }
  }

  private createCollider(): void {
    if (!this.model) return

    // 모델의 모든 메시를 찾아서 콜라이더 그룹 생성
    const colliderGroup = new THREE.Group()
    
    this.model.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        // 원본 메시의 지오메트리를 복제
        const colliderGeometry = child.geometry.clone()
        
        // 투명한 재질로 콜라이더 메시 생성
        const colliderMaterial = new THREE.MeshBasicMaterial({
          transparent: true,
          opacity: 0, // 다시 완전히 투명하게 설정
          color: 0x00ff00,
          visible: true,
          wireframe: false // 와이어프레임 비활성화
        })
        
        const colliderMesh = new THREE.Mesh(colliderGeometry, colliderMaterial)
        
        // 원본 메시의 변환 정보 복사
        colliderMesh.position.copy(child.position)
        colliderMesh.rotation.copy(child.rotation)
        colliderMesh.scale.copy(child.scale)
        
        // 콜라이더 식별 정보 추가
        colliderMesh.userData.modelId = this.id
        colliderMesh.userData.isCollider = true
        
        colliderGroup.add(colliderMesh)
      }
    })
    
    // 콜라이더 그룹을 모델에 추가
    this.model.add(colliderGroup)
    
    // 첫 번째 콜라이더 메시를 참조용으로 저장 (기존 코드 호환성)
    this.collider = colliderGroup.children[0] as THREE.Mesh
    
    console.log(`Mesh collider created for ${this.id} with ${colliderGroup.children.length} mesh(es)`)
  }

  protected applyTransforms(): void {
    if (!this.model) return

    this.model.position.set(this.position.x, this.position.y, this.position.z)
    this.model.scale.set(this.scale.x, this.scale.y, this.scale.z)
    this.model.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z)
  }

  public addToScene(scene: THREE.Scene): void {
    if (this.model && this.isLoaded) {
      scene.add(this.model)
    }
  }

  public removeFromScene(scene: THREE.Scene): void {
    if (this.model && this.isLoaded) {
      scene.remove(this.model)
    }
  }

  public setPosition(position: Partial<ModelPosition>): void {
    this.position = { ...this.position, ...position }
    if (this.model) {
      this.model.position.set(this.position.x, this.position.y, this.position.z)
    }
  }

  public setScale(scale: Partial<ModelScale>): void {
    this.scale = { ...this.scale, ...scale }
    if (this.model) {
      this.model.scale.set(this.scale.x, this.scale.y, this.scale.z)
    }
  }

  public setRotation(rotation: Partial<ModelRotation>): void {
    this.rotation = { ...this.rotation, ...rotation }
    if (this.model) {
      this.model.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z)
    }
  }

  public getPosition(): ModelPosition {
    return { ...this.position }
  }

  public getScale(): ModelScale {
    return { ...this.scale }
  }

  public getRotation(): ModelRotation {
    return { ...this.rotation }
  }

  // 90도 회전 기능 추가
  public rotateY90(): void {
    const newRotationY = this.rotation.y + Math.PI / 2
    this.setRotation({ y: newRotationY })
    console.log(`Model ${this.id} rotated 90 degrees. New Y rotation: ${newRotationY}`)
  }

  public getId(): string {
    return this.id
  }

  public getModel(): THREE.Group | undefined {
    return this.model
  }

  public getCollider(): THREE.Mesh | undefined {
    return this.collider
  }

  public getAllColliders(): THREE.Mesh[] {
    if (!this.model) return []
    
    const colliders: THREE.Mesh[] = []
    this.model.traverse((child) => {
      if (child instanceof THREE.Mesh && child.userData.isCollider && child.userData.modelId === this.id) {
        colliders.push(child)
      }
    })
    
    return colliders
  }

  public isModelLoaded(): boolean {
    return this.isLoaded
  }

  // 자식 클래스에서 구현해야 하는 업데이트 메서드
  public abstract update(): void

  // 자식 클래스에서 구현할 수 있는 초기화 메서드
  protected abstract setupModel(): void

  public dispose(): void {
    if (this.model) {
      this.model.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (object.material instanceof THREE.Material) {
            object.material.dispose()
          }
        }
      })
    }
  }
} 