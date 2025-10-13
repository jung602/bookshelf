import * as THREE from 'three'
import { BaseModel } from '../objects/BaseModel'
import { SceneIndex } from './SceneIndex'
import { BoundingBoxVisualizer } from './BoundingBoxVisualizer'
import { calculateBoundingBox } from './BoundingBoxUtils'

// 상수 정의
const CUBE_SIZE = 0.1

export class WallModelManager {
  private scene: THREE.Scene
  private models: Map<string, BaseModel>
  private sceneIndex: SceneIndex
  private raycaster: THREE.Raycaster = new THREE.Raycaster()
  private visualizer: BoundingBoxVisualizer

  constructor(scene: THREE.Scene, models: Map<string, BaseModel>, sceneIndex: SceneIndex) {
    this.scene = scene
    this.models = models
    this.sceneIndex = sceneIndex
    this.visualizer = new BoundingBoxVisualizer(scene, models, 0xffff00)
  }

  // 바닥 높이 계산 (FloorModelManager와 동일한 로직)
  private getFloorHeight(x: number, z: number): number {
    const rayOrigin = new THREE.Vector3(x, 100, z) // 위에서 아래로 쏴보기
    const rayDirection = new THREE.Vector3(0, -1, 0)
    this.raycaster.set(rayOrigin, rayDirection)
    
    const floorMeshes = this.sceneIndex.getFloorMeshes()
    if (floorMeshes.length === 0) return 0
    
    const intersections = this.raycaster.intersectObjects(floorMeshes)
    if (intersections.length > 0) {
      return intersections[0].point.y
    }
    return 0
  }

  private getModelBottomOffset(model: BaseModel): number {
    const customBB = model.getCustomBoundingBox()
    if (customBB && customBB.offsetY !== undefined) {
      return customBB.offsetY
    }
    
    const boundingBox = calculateBoundingBox(model)
    if (!boundingBox) return 0
    
    const position = model.getPosition()
    return boundingBox.min.y - position.y
  }

  // 벽 가구 추가 메소드
  public async addWallModel(
    model: BaseModel, 
    options: {
      position?: { x: number, y: number, z: number },
      useOptimalPlacement?: boolean
    } = {}
  ): Promise<string> {
    try {
      await model.load()
      
      const { position, useOptimalPlacement = true } = options
      const defaultPosition = position || { x: 0, y: 0, z: 0 }
      
      // 벽 가구 배치 가능 여부 검사
      if (!this.canPlaceOnWall(model, defaultPosition.x, defaultPosition.z)) {
        model.dispose()
        throw new Error(`벽 가구를 배치할 수 없습니다. 벽이 가구보다 작거나 벽이 없습니다.`)
      }
      
      if (useOptimalPlacement) {
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
      } else {
        // 지정된 위치에 직접 부착
        const attached = this.attachToNearestWall(model, defaultPosition.x, defaultPosition.z, defaultPosition.y)
        if (!attached) {
          model.dispose()
          throw new Error('벽에 부착할 수 없습니다.')
        }
      }
      
      model.addToScene(this.scene)
      this.models.set(model.getId(), model)
      
      // 바운딩박스 헬퍼 업데이트
      if (this.visualizer.isEnabled()) {
        this.visualizer.updateHelper(model)
      }
      
      return model.getId()
    } catch (error) {
      // 개발 환경에서만 에러 로깅
      if (process.env.NODE_ENV === 'development') {
        console.error('Failed to add wall model:', error)
      }
      throw error
    }
  }

  private findNearestWall(x: number, z: number): THREE.Mesh | null {
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

  private isModelSmallerThanWall(model: BaseModel, wall: THREE.Mesh): boolean {
    const modelBox = calculateBoundingBox(model)
    if (!modelBox) return false
    
    const wallScale = wall.scale
    const modelWidth = modelBox.max.x - modelBox.min.x
    const modelHeight = modelBox.max.y - modelBox.min.y
    const wallWidth = wallScale.x
    const wallHeight = wallScale.y
    return modelWidth < wallWidth && modelHeight < wallHeight
  }

  private canPlaceOnWall(model: BaseModel, x: number, z: number): boolean {
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
    
    // 벽 방향에 따라 위치 및 회전 설정
    const offsetDistance = 0.01 // 벽에 딱 붙도록 최소 오프셋
    if (Math.abs(wallRotation) < 0.1 || Math.abs(wallRotation - Math.PI) < 0.1) {
      const wallMinX = wallPos.x - wallScale.x/2 + cubeSize
      const wallMaxX = wallPos.x + wallScale.x/2 - cubeSize
      const clampedX = Math.max(wallMinX, Math.min(wallMaxX, targetX))
      attachX = clampedX
      attachZ = wallRotation < 0.1 ? wallPos.z + offsetDistance : wallPos.z - offsetDistance
      // 벽과 평행하게 회전 설정
      this.alignModelToWall(model, wallRotation)
    } else {
      const wallMinZ = wallPos.z - wallScale.x/2 + cubeSize
      const wallMaxZ = wallPos.z + wallScale.x/2 - cubeSize
      const clampedZ = Math.max(wallMinZ, Math.min(wallMaxZ, targetZ))
      attachZ = clampedZ
      attachX = Math.abs(wallRotation - Math.PI/2) < 0.1 ? wallPos.x + offsetDistance : wallPos.x - offsetDistance
      // 벽과 평행하게 회전 설정
      this.alignModelToWall(model, wallRotation)
    }
    model.setPosition({ x: attachX, y: attachY, z: attachZ })
    return true
  }

  // 모델을 벽과 평행하게 정렬
  private alignModelToWall(model: BaseModel, wallRotation: number): void {
    const modelObj = model.getModel()
    if (modelObj) {
      // 벽 회전에 맞춰서 모델도 회전
      const currentRotation = model.getRotation()
      const targetRotation = wallRotation // 벽과 같은 방향으로 회전
      model.setRotation({ y: targetRotation })
      // x, z 회전은 유지하고 y만 변경
      if (modelObj) {
        modelObj.rotation.set(currentRotation.x, targetRotation, currentRotation.z)
      }
    }
  }

  public repositionWallModelsAfterWallChange(): string[] {
    const idsToDelete: string[] = []
    const wallModels = Array.from(this.models.values()).filter(m => m.getType() === 'wall' && m.isModelLoaded())
    wallModels.forEach(model => {
      const pos = model.getPosition()
      const ok = this.attachToNearestWall(model, pos.x, pos.z, pos.y)
      if (!ok) {
        idsToDelete.push(model.getId())
      }
    })
    return idsToDelete
  }

  // 벽 가구 제거 후 처리 (ModelManager에서 호출)
  public onWallModelRemoved(): void {
    // 모델 제거 시 자동으로 정리됨
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
    

    
    // 3. 같은 벽에서 다른 높이 시도
    const sameWallPositions = this.generateSameWallPositions(targetX, targetZ, defaultY)
    for (const pos of sameWallPositions) {
      if (!this.hasWallCollisionAt(model, pos.x, pos.z, pos.y)) {
        return pos
      }
    }
    
    // 4. 다른 벽에서 시도
    const otherWallPositions = this.generateOtherWallPositions(targetX, targetZ, defaultY)
    for (const pos of otherWallPositions) {
      if (this.canPlaceOnWall(model, pos.x, pos.z) && !this.hasWallCollisionAt(model, pos.x, pos.z, pos.y)) {
        return pos
      }
    }
    
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

    // 모델 크기 계산 (캐시 사용)
    const tempBounds = calculateBoundingBox(model)
    if (!tempBounds) return false
    
    const modelSize = {
      width: tempBounds.max.x - tempBounds.min.x,
      height: tempBounds.max.y - tempBounds.min.y,
      depth: tempBounds.max.z - tempBounds.min.z
    }

    // 다른 벽 가구들과의 충돌 검사
    for (const [otherId, otherModel] of this.models) {
      const isOtherWallModel = otherModel.getType() === 'wall'
      if (otherId === model.getId() || !isOtherWallModel) continue
      
      const otherPos = otherModel.getPosition()
      const otherBounds = calculateBoundingBox(otherModel)
      if (!otherBounds) continue

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

  // 바운딩박스 시각화 메서드들 (Visualizer로 위임)
  public enableBoundingBoxVisualization(): void {
    this.visualizer.enable((model) => model.getType() === 'wall')
  }

  public disableBoundingBoxVisualization(): void {
    this.visualizer.disable()
  }

  public toggleBoundingBoxVisualization(): boolean {
    this.visualizer.toggle((model) => model.getType() === 'wall')
    return this.visualizer.isEnabled()
  }

  public updateAllBoundingBoxHelpers(): void {
    this.visualizer.updateAll((model) => model.getType() === 'wall')
  }

  public updateModelBoundingBox(modelId: string): void {
    this.visualizer.updateModel(modelId)
  }
}
