import * as THREE from 'three'
import { BaseModel, ModelPosition, ModelScale, ModelRotation } from './BaseModel'

export class WallCube extends BaseModel {
  private attachedWall: THREE.Mesh | null = null
  private wallDirection: string | null = null

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

  public attachToWall(scene: THREE.Scene, targetX: number, targetZ: number, targetY?: number): boolean {
    const wall = this.findNearestWall(scene, targetX, targetZ)
    
    if (!wall) {
      return false
    }

    this.attachedWall = wall
    this.wallDirection = this.determineWallDirection(wall)
    
    const wallPosition = this.calculateWallAttachmentPosition(wall, targetX, targetZ, targetY)
    
    this.setPosition({
      x: wallPosition.x,
      y: wallPosition.y,
      z: wallPosition.z
    })

    return true
  }

  private findNearestWall(scene: THREE.Scene, x: number, z: number): THREE.Mesh | null {
    const walls: THREE.Mesh[] = []
    
    scene.traverse((child) => {
      if (child.userData.isWall && child instanceof THREE.Mesh) {
        walls.push(child)
      }
    })

    if (walls.length === 0) return null

    let nearestWall: THREE.Mesh | null = null
    let minDistance = Infinity

    walls.forEach(wall => {
      const wallPos = wall.position
      const distance = Math.sqrt(
        Math.pow(x - wallPos.x, 2) + Math.pow(z - wallPos.z, 2)
      )
      
      if (distance < minDistance) {
        minDistance = distance
        nearestWall = wall
      }
    })

    return nearestWall
  }

  private determineWallDirection(wall: THREE.Mesh): string {
    const rotation = wall.rotation.y
    
    if (Math.abs(rotation) < 0.1) return 'north'
    if (Math.abs(rotation - Math.PI) < 0.1) return 'south'
    if (Math.abs(rotation - Math.PI/2) < 0.1) return 'west'
    if (Math.abs(rotation + Math.PI/2) < 0.1) return 'east'
    
    return 'unknown'
  }

  private calculateWallAttachmentPosition(wall: THREE.Mesh, targetX: number, targetZ: number, targetY?: number): THREE.Vector3 {
    const wallPos = wall.position
    const wallScale = wall.scale
    const cubeSize = 0.1
    
    let attachX = wallPos.x
    let attachY = wallPos.y // 기본값은 벽 중앙
    let attachZ = wallPos.z

    // Y 위치 계산 - targetY가 제공되면 벽의 범위 내에서 조정
    if (targetY !== undefined) {
      const wallMinY = wallPos.y - wallScale.y/2 + cubeSize/2
      const wallMaxY = wallPos.y + wallScale.y/2 - cubeSize/2
      attachY = Math.max(wallMinY, Math.min(wallMaxY, targetY))
    }

    switch (this.wallDirection) {
      case 'north':
        // 벽의 월드 좌표 기준으로 X 범위 계산
        const northMinX = wallPos.x - wallScale.x/2 + cubeSize
        const northMaxX = wallPos.x + wallScale.x/2 - cubeSize
        attachX = Math.max(northMinX, Math.min(northMaxX, targetX))
        attachZ = wallPos.z + cubeSize
        break
      
      case 'south':
        // 벽의 월드 좌표 기준으로 X 범위 계산
        const southMinX = wallPos.x - wallScale.x/2 + cubeSize
        const southMaxX = wallPos.x + wallScale.x/2 - cubeSize
        attachX = Math.max(southMinX, Math.min(southMaxX, targetX))
        attachZ = wallPos.z - cubeSize
        break
      
      case 'west':
        attachX = wallPos.x + cubeSize
        // 벽의 월드 좌표 기준으로 Z 범위 계산
        const westMinZ = wallPos.z - wallScale.x/2 + cubeSize
        const westMaxZ = wallPos.z + wallScale.x/2 - cubeSize
        attachZ = Math.max(westMinZ, Math.min(westMaxZ, targetZ))
        break
      
      case 'east':
        attachX = wallPos.x - cubeSize
        // 벽의 월드 좌표 기준으로 Z 범위 계산
        const eastMinZ = wallPos.z - wallScale.x/2 + cubeSize
        const eastMaxZ = wallPos.z + wallScale.x/2 - cubeSize
        attachZ = Math.max(eastMinZ, Math.min(eastMaxZ, targetZ))
        break
    }

    return new THREE.Vector3(attachX, attachY, attachZ)
  }

  protected setupModel(): void {

  }

  public update(): void {
    // 애니메이션 로직
  }

  public getType(): string {
    return 'wallcube'
  }

  public getAttachedWall(): THREE.Mesh | null {
    return this.attachedWall
  }

  public getWallDirection(): string | null {
    return this.wallDirection
  }
}

export const modelMetadata = {
  id: 'wallcube',
  name: '벽 큐브',
  description: '벽에 부착되는 테스트 큐브',
  icon: '🟥',
  modelClass: WallCube
} 