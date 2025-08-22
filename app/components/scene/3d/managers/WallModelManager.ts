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

  // 바닥 높이 계산 (FloorModelManager와 동일한 로직)
  private getFloorHeight(x: number, z: number): number {
    const raycaster = new THREE.Raycaster()
    const rayOrigin = new THREE.Vector3(x, 100, z) // 위에서 아래로 쏴보기
    const rayDirection = new THREE.Vector3(0, -1, 0)
    raycaster.set(rayOrigin, rayDirection)
    
    const floorMeshes = this.sceneIndex.getFloorMeshes()
    if (floorMeshes.length === 0) return 0
    
    const intersections = raycaster.intersectObjects(floorMeshes)
    if (intersections.length > 0) {
      return intersections[0].point.y
    }
    return 0
  }

  // 모델 하단 오프셋 계산 (FloorModelManager와 동일한 로직)
  private getModelBottomOffset(model: BaseModel): number {
    const modelGroup = model.getModel()
    if (!modelGroup) return 0
    
    const boundingBox = new THREE.Box3().setFromObject(modelGroup)
    return boundingBox.min.y
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
      
      // 최적의 위치 찾기 (충돌 회피 포함)
      const optimalPosition = this.findOptimalWallPosition(model, defaultPosition.x, defaultPosition.z, position?.y)
      if (!optimalPosition) {
        model.dispose()
        throw new Error('벽에 배치할 수 있는 적절한 공간이 없습니다.')
      }
      
      // 최적 위치에 벽 가구 부착
      const attached = this.attachToNearestWall(model, optimalPosition.x, optimalPosition.z, optimalPosition.y)
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
    
    // 바닥 높이 계산 (바닥 관통 방지)
    const floorHeight = this.getFloorHeight(targetX, targetZ)
    const modelBottomOffset = this.getModelBottomOffset(model)
    const minAllowedY = floorHeight - modelBottomOffset + cubeSize/2
    
    if (targetY !== undefined) {
      const wallMinY = wallPos.y - wallScale.y/2 + cubeSize/2
      const wallMaxY = wallPos.y + wallScale.y/2 - cubeSize/2
      // 사용자 지정 Y 좌표를 벽 범위와 바닥 관통 방지 조건 내에서 적용
      attachY = Math.max(minAllowedY, Math.max(wallMinY, Math.min(wallMaxY, targetY)))
    } else {
      // targetY가 없으면 벽 중앙(1.5) 또는 벽 최소 Y 중 큰 값 사용
      const wallMinY = wallPos.y - wallScale.y/2 + cubeSize/2
      const preferredY = 1.5 // 벽 중앙 높이
      attachY = Math.max(minAllowedY, Math.max(wallMinY, Math.min(wallPos.y + wallScale.y/2 - cubeSize/2, preferredY)))
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

  // 벽 가구 최적 위치 찾기 (충돌 회피)
  private findOptimalWallPosition(
    model: BaseModel, 
    targetX: number, 
    targetZ: number, 
    preferredY?: number
  ): { x: number; z: number; y: number } | null {
    // 1. 선호하는 Y 위치 설정 (기본값: 1.5 - 벽 중앙)
    const defaultY = preferredY !== undefined ? preferredY : 1.5
    
    // 2. 목표 위치에서 충돌 검사
    if (!this.hasWallCollisionAt(model, targetX, targetZ, defaultY)) {
      return { x: targetX, z: targetZ, y: defaultY }
    }
    
    console.log(`[WallModelManager] Collision detected at preferred position (${targetX}, ${defaultY}, ${targetZ}), searching alternatives...`)
    
    // 3. 같은 벽에서 다른 높이 시도
    const sameWallPositions = this.generateSameWallPositions(targetX, targetZ, defaultY)
    for (const pos of sameWallPositions) {
      if (!this.hasWallCollisionAt(model, pos.x, pos.z, pos.y)) {
        console.log(`[WallModelManager] Found alternative position on same wall: (${pos.x}, ${pos.y}, ${pos.z})`)
        return pos
      }
    }
    
    // 4. 다른 벽에서 시도
    const otherWallPositions = this.generateOtherWallPositions(targetX, targetZ, defaultY)
    for (const pos of otherWallPositions) {
      if (this.canPlaceOnWall(model, pos.x, pos.z) && !this.hasWallCollisionAt(model, pos.x, pos.z, pos.y)) {
        console.log(`[WallModelManager] Found position on different wall: (${pos.x}, ${pos.y}, ${pos.z})`)
        return pos
      }
    }
    
    console.warn(`[WallModelManager] No suitable wall position found for model`)
    return null
  }

  // 같은 벽에서 다른 높이 후보 생성
  private generateSameWallPositions(x: number, z: number, originalY: number): { x: number; z: number; y: number }[] {
    const positions: { x: number; z: number; y: number }[] = []
    
    // Y 좌표 후보들 (벽 중앙 기준으로 위아래)
    const yCandidates = [
      originalY + 0.3, // 약간 위
      originalY - 0.3, // 약간 아래  
      originalY + 0.6, // 더 위
      originalY - 0.6, // 더 아래
      2.0,             // 벽 상단 근처
      1.0,             // 벽 하단 근처
      0.5              // 바닥 근처
    ]
    
    // X, Z 위치도 약간씩 변경해서 시도
    const xyOffsets = [
      { x: 0, z: 0 },     // 원래 위치
      { x: 0.2, z: 0 },   // 오른쪽으로
      { x: -0.2, z: 0 },  // 왼쪽으로
      { x: 0, z: 0.2 },   // 앞으로
      { x: 0, z: -0.2 }   // 뒤로
    ]
    
    for (const yCandidate of yCandidates) {
      for (const offset of xyOffsets) {
        positions.push({
          x: x + offset.x,
          z: z + offset.z,
          y: yCandidate
        })
      }
    }
    
    return positions
  }

  // 다른 벽 위치 후보 생성
  private generateOtherWallPositions(originalX: number, originalZ: number, preferredY: number): { x: number; z: number; y: number }[] {
    const positions: { x: number; z: number; y: number }[] = []
    const walls = this.sceneIndex.getWallMeshes()
    
    for (const wall of walls) {
      const wallPos = wall.position
      
      // 원래 위치와 다른 벽인지 확인 (거리로 판단)
      const distance = Math.sqrt(Math.pow(originalX - wallPos.x, 2) + Math.pow(originalZ - wallPos.z, 2))
      if (distance < 0.5) continue // 같은 벽이면 스킵
      
      // 해당 벽의 여러 위치 시도
      const wallPositions = [
        { x: wallPos.x, z: wallPos.z, y: preferredY },       // 벽 중앙, 선호 높이
        { x: wallPos.x, z: wallPos.z, y: 1.5 },              // 벽 중앙, 기본 높이
        { x: wallPos.x + 0.3, z: wallPos.z, y: preferredY }, // 벽 오른쪽
        { x: wallPos.x - 0.3, z: wallPos.z, y: preferredY }, // 벽 왼쪽
        { x: wallPos.x, z: wallPos.z + 0.3, y: preferredY }, // 벽 앞쪽
        { x: wallPos.x, z: wallPos.z - 0.3, y: preferredY }  // 벽 뒤쪽
      ]
      
      positions.push(...wallPositions)
    }
    
    return positions
  }

  // 벽 가구 충돌 검사 (3D 위치 포함)
  private hasWallCollisionAt(model: BaseModel, x: number, z: number, y: number): boolean {
    const modelGroup = model.getModel()
    if (!modelGroup) return false

    // 모델 크기 계산
    const tempBounds = new THREE.Box3().setFromObject(modelGroup)
    const modelSize = {
      width: tempBounds.max.x - tempBounds.min.x,
      height: tempBounds.max.y - tempBounds.min.y,
      depth: tempBounds.max.z - tempBounds.min.z
    }

    // 다른 벽 가구들과의 충돌 검사
    for (const [otherId, otherModel] of this.models) {
      if (otherId === model.getId() || otherModel.getType() !== 'wallcube') continue
      
      const otherPos = otherModel.getPosition()
      const otherGroup = otherModel.getModel()
      if (!otherGroup) continue

      const otherBounds = new THREE.Box3().setFromObject(otherGroup)
      const otherSize = {
        width: otherBounds.max.x - otherBounds.min.x,
        height: otherBounds.max.y - otherBounds.min.y,
        depth: otherBounds.max.z - otherBounds.min.z
      }

      // 3D 충돌 검사
      const xDistance = Math.abs(x - otherPos.x)
      const yDistance = Math.abs(y - otherPos.y)
      const zDistance = Math.abs(z - otherPos.z)
      
      const xThreshold = (modelSize.width + otherSize.width) / 2 + 0.05
      const yThreshold = (modelSize.height + otherSize.height) / 2 + 0.05  
      const zThreshold = (modelSize.depth + otherSize.depth) / 2 + 0.05

      if (xDistance < xThreshold && yDistance < yThreshold && zDistance < zThreshold) {
        return true // 충돌 발생
      }
    }

    return false // 충돌 없음
  }
}


