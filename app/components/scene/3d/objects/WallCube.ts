import * as THREE from 'three'
import { BaseModel, ModelPosition, ModelScale, ModelRotation } from './BaseModel'

export class WallCube extends BaseModel {
  constructor(
    position: ModelPosition = { x: 0, y: 0.5, z: 0 },
    scale: ModelScale = { x: 0.2, y: 0.2, z: 0.2 },
    rotation: ModelRotation = { x: 0, y: 0, z: 0 }
  ) {
    super('', position, scale, rotation)
  }

  public async load(): Promise<void> {
    try {
      this.createCubeModel()
      this.applyTransforms()
      this.createCubeCollider()
      this.isLoaded = true
      

    } catch (error) {
      console.error('Failed to load WallCube:', error)
      throw error
    }
  }

  private createCubeModel(): void {
    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshStandardMaterial({
      color: 0xff6b6b,
      roughness: 0.7,
      metalness: 0.1
    })

    this.model = new THREE.Group()
    const cubeMesh = new THREE.Mesh(geometry, material)
    cubeMesh.castShadow = true
    cubeMesh.receiveShadow = true
    
    this.model.add(cubeMesh)
  }

  private createCubeCollider(): void {
    if (!this.model) return

    const geometry = new THREE.BoxGeometry(1, 1, 1)
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      color: 0x00ff00,
      visible: true
    })

    const colliderMesh = new THREE.Mesh(geometry, material)
    colliderMesh.userData.modelId = this.id
    colliderMesh.userData.isCollider = true
    
    this.model.add(colliderMesh)
    this.collider = colliderMesh
  }

  protected setupModel(): void {
    // 벽 큐브의 실제 바운딩박스 계산
    if (this.model) {
      const boundingBox = new THREE.Box3().setFromObject(this.model)
      const width = boundingBox.max.x - boundingBox.min.x
      const height = boundingBox.max.y - boundingBox.min.y
      const depth = boundingBox.max.z - boundingBox.min.z
      const offsetY = boundingBox.min.y - this.model.position.y
      
      // 박스 바운딩박스 설정
      this.setCustomBoundingBox({
        type: 'box',
        width: width,
        height: height,
        depth: depth,
        offsetY: offsetY
      })
    }
  }

  public update(): void {
    // 애니메이션 로직
  }

  public getType(): string {
    return 'wallcube'
  }
} 