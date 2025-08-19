import * as THREE from 'three'
import { BaseModel } from '../objects/BaseModel'
import { SceneIndex } from './SceneIndex'

// 상수 정의
const CUBE_SIZE = 0.1

export class WallModelManager {
  private scene: THREE.Scene
  private models: Map<string, BaseModel>
  private sceneIndex: SceneIndex

  constructor(scene: THREE.Scene, models: Map<string, BaseModel>, sceneIndex: SceneIndex) {
    this.scene = scene
    this.models = models
    this.sceneIndex = sceneIndex
  }

  // 벽 가구 추가 메소드
  public async addWallModel(model: BaseModel, position?: { x: number; y: number; z: number }): Promise<string> {
    try {
      await model.load()
      
      const defaultPosition = position || { x: 0, y: 0, z: 0 }
      
      // 벽 가구 배치 가능 여부 검사
      if (!this.canPlaceOnWall(model, defaultPosition.x, defaultPosition.z)) {
        model.dispose()
        throw new Error(`벽 가구를 배치할 수 없습니다. 벽이 가구보다 작거나 벽이 없습니다.`)
      }
      
      // 가장 가까운 벽에 부착
      const attached = this.attachToNearestWall(model, defaultPosition.x, defaultPosition.z, defaultPosition.y)
      if (!attached) {
        model.dispose()
        throw new Error('벽에 부착할 수 없습니다.')
      }
      
      model.addToScene(this.scene)
      this.models.set(model.getId(), model)
      
      return model.getId()
    } catch (error) {
      console.error('Failed to add wall model:', error)
      throw error
    }
  }

  // 벽 가구 회전
  public rotateWallModel(modelId: string): void {
    const model = this.models.get(modelId)
    if (model && model.getType() === 'wallcube') {
      model.rotateY90()
      // 회전 후 벽에 다시 부착
      const pos = model.getPosition()
      this.attachToNearestWall(model, pos.x, pos.z, pos.y)
    }
  }

  // 벽 가구 이동
  public moveWallModel(modelId: string, x: number, z: number, y?: number): void {
    const model = this.models.get(modelId)
    if (!model || model.getType() !== 'wallcube') return

    // 벽에 부착하도록 개선
    const attached = this.attachToNearestWall(model, x, z, y)
    if (!attached) {
      // 부착 실패 시 원래 위치 유지
      console.warn(`Failed to attach wallcube ${modelId} to nearest wall`)
    }
  }

  public findNearestWall(x: number, z: number): THREE.Mesh | null {
    const walls: THREE.Mesh[] = this.sceneIndex.getWallMeshes()
    if (walls.length === 0) return null
    let nearestWall: THREE.Mesh | null = null
    let minDistance = Infinity
    walls.forEach(wall => {
      const wallPos = wall.position
      const distance = Math.sqrt(Math.pow(x - wallPos.x, 2) + Math.pow(z - wallPos.z, 2))
      if (distance < minDistance) {
        minDistance = distance
        nearestWall = wall
      }
    })
    return nearestWall
  }

  public isModelSmallerThanWall(model: BaseModel, wall: THREE.Mesh): boolean {
    const modelGroup = model.getModel()
    if (!modelGroup) return false
    const modelBox = new THREE.Box3().setFromObject(modelGroup)
    const wallScale = wall.scale
    const modelWidth = modelBox.max.x - modelBox.min.x
    const modelHeight = modelBox.max.y - modelBox.min.y
    const wallWidth = wallScale.x
    const wallHeight = wallScale.y
    return modelWidth < wallWidth && modelHeight < wallHeight
  }

  public canPlaceOnWall(model: BaseModel, x: number, z: number): boolean {
    const nearestWall = this.findNearestWall(x, z)
    if (!nearestWall) {
      return false
    }
    return this.isModelSmallerThanWall(model, nearestWall)
  }

  public attachToNearestWall(model: BaseModel, targetX: number, targetZ: number, targetY?: number): boolean {
    const wall = this.findNearestWall(targetX, targetZ)
    if (!wall) {
      return false
    }
    const wallPos = wall.position
    const wallScale = wall.scale
    const wallRotation = wall.rotation.y
    const cubeSize = CUBE_SIZE
    let attachX = wallPos.x
    let attachY = wallPos.y
    let attachZ = wallPos.z
    if (targetY !== undefined) {
      const wallMinY = wallPos.y - wallScale.y/2 + cubeSize/2
      const wallMaxY = wallPos.y + wallScale.y/2 - cubeSize/2
      attachY = Math.max(wallMinY, Math.min(wallMaxY, targetY))
    }
    if (Math.abs(wallRotation) < 0.1 || Math.abs(wallRotation - Math.PI) < 0.1) {
      const wallMinX = wallPos.x - wallScale.x/2 + cubeSize
      const wallMaxX = wallPos.x + wallScale.x/2 - cubeSize
      const clampedX = Math.max(wallMinX, Math.min(wallMaxX, targetX))
      attachX = clampedX
      attachZ = wallRotation < 0.1 ? wallPos.z + cubeSize : wallPos.z - cubeSize
    } else {
      const wallMinZ = wallPos.z - wallScale.x/2 + cubeSize
      const wallMaxZ = wallPos.z + wallScale.x/2 - cubeSize
      const clampedZ = Math.max(wallMinZ, Math.min(wallMaxZ, targetZ))
      attachZ = clampedZ
      attachX = Math.abs(wallRotation - Math.PI/2) < 0.1 ? wallPos.x + cubeSize : wallPos.x - cubeSize
    }
    model.setPosition({ x: attachX, y: attachY, z: attachZ })
    return true
  }

  public repositionWallModelsAfterWallChange(): string[] {
    const idsToDelete: string[] = []
    const wallModels = Array.from(this.models.values()).filter(m => m.getType() === 'wallcube' && m.isModelLoaded())
    wallModels.forEach(model => {
      const pos = model.getPosition()
      const ok = this.attachToNearestWall(model, pos.x, pos.z, pos.y)
      if (!ok) {
        idsToDelete.push(model.getId())
      }
    })
    return idsToDelete
  }
}


