import * as THREE from 'three'
import { BaseModel } from '../objects/BaseModel'
import { SceneIndex } from './SceneIndex'
import { BoundingBoxVisualizer } from './BoundingBoxVisualizer'
import { calculateBoundingBox } from './BoundingBoxUtils'

export class FloorModelManager {
  private scene: THREE.Scene
  private models: Map<string, BaseModel>
  private sceneIndex: SceneIndex
  private raycaster: THREE.Raycaster = new THREE.Raycaster()
  private visualizer: BoundingBoxVisualizer

  constructor(scene: THREE.Scene, models: Map<string, BaseModel>, sceneIndex: SceneIndex) {
    this.scene = scene
    this.models = models
    this.sceneIndex = sceneIndex
    this.visualizer = new BoundingBoxVisualizer(scene, models, 0x00ffff)
  }

  // 통합된 바닥 가구 추가 메소드
  public async addFloorModel(
    model: BaseModel, 
    options: {
      position?: { x: number, y: number, z: number },
      useOptimalPlacement?: boolean
    } = {}
  ): Promise<string> {
    // 바닥이 없으면 모델 추가 거부
    if (!this.hasFloorMeshes()) {
      throw new Error('바닥을 먼저 생성해주세요. 모델은 바닥이 있어야만 배치할 수 있습니다.')
    }

    try {
      await model.load()
      
      const { position, useOptimalPlacement = true } = options
      
      if (useOptimalPlacement || !position) {
        // 스마트 배치: 최적의 위치 찾기
        const optimalPosition = this.findOptimalPlacement(model)
        if (!optimalPosition) {
          model.dispose()
          throw new Error('바닥이 너무 좁아서 가구를 배치할 수 없습니다. 바닥을 넓히거나 다른 가구를 제거해주세요.')
        }
        model.setPosition(optimalPosition)
      } else {
        // 지정된 위치에 배치 시도
        if (!this.canPlaceOnFloor(model, position.x, position.z)) {
          model.dispose()
          throw new Error(`바닥 가구를 배치할 수 없습니다. 바닥이 가구보다 작거나 바닥이 없습니다.`)
        }
        
        // 표면 Y 좌표 계산하여 배치
        const surfaceY = this.calculateSurfaceY(model, position.x, position.z)
        model.setPosition({ x: position.x, y: surfaceY, z: position.z })
      }
      
      model.addToScene(this.scene)
      this.models.set(model.getId(), model)
      
      // 바운딩박스 헬퍼 업데이트
      if (this.visualizer.isEnabled()) {
        this.visualizer.updateHelper(model)
      }
      
      return model.getId()
    } catch (error) {
      console.error('Failed to add floor model:', error)
      throw error
    }
  }

  public hasFloorMeshes(): boolean {
    return this.sceneIndex.getFloorMeshes().length > 0
  }

  public getFloorMeshes(): THREE.Mesh[] {
    return this.sceneIndex.getFloorMeshes()
  }

  // 통합된 Raycasting 헬퍼 메소드
  private performFloorRaycast(
    x: number, 
    z: number, 
    options: {
      rayOriginY?: number,
      targets?: 'floor-only' | 'all-colliders',
      excludeModelIds?: string[],
      targetModel?: BaseModel
    } = {}
  ): THREE.Intersection[] {
    const { 
      rayOriginY = 10, 
      targets = 'floor-only', 
      excludeModelIds = [],
      targetModel 
    } = options

    const rayOrigin = new THREE.Vector3(x, rayOriginY, z)
    const rayDirection = new THREE.Vector3(0, -1, 0)
    this.raycaster.set(rayOrigin, rayDirection)

    const colliders: THREE.Mesh[] = []

    if (targets === 'all-colliders' && targetModel) {
      // 다른 모델들의 콜라이더 포함 (벽 가구도 포함)
      this.models.forEach((otherModel, modelId) => {
        if (modelId !== targetModel.getId() &&
            !excludeModelIds.includes(modelId) &&
            otherModel.isModelLoaded() &&
            otherModel.getModel()) {
          const modelColliders = otherModel.getAllColliders()
          if (modelColliders && modelColliders.length > 0) {
            const validColliders = modelColliders.filter(collider => {
              return collider.parent && this.scene.getObjectById(collider.id) !== undefined
            })
            if (validColliders.length > 0) {
              colliders.push(...validColliders)
            }
          }
        }
      })
    }

    // 바닥 메시 추가
    const floorMeshes = this.sceneIndex.getFloorMeshes()
    colliders.push(...floorMeshes)

    return this.raycaster.intersectObjects(colliders, false)
  }

  // 모델 바운딩 박스 계산 헬퍼
  private getModelBoundsAt(model: BaseModel, x: number, z: number): THREE.Box3 | null {
    return calculateBoundingBox(model, x, z)
  }

  public hasFloorAt(x: number, z: number): boolean {
    const intersections = this.performFloorRaycast(x, z, { rayOriginY: 1 })
    return intersections.length > 0
  }

  public getFloorBounds(): { minX: number, maxX: number, minZ: number, maxZ: number } | null {
    return this.sceneIndex.getFloorBounds()
  }

  public getFloorHeight(x: number, z: number): number {
    const intersections = this.performFloorRaycast(x, z)
    return intersections.length > 0 ? intersections[0].point.y : 0
  }

  public clampToBounds(model: BaseModel, x: number, z: number, inset: number = 0): { x: number, z: number } {
    const floorBounds = this.getFloorBounds()
    if (!floorBounds) {
      return { x, z }
    }

    const modelBoundingBox = this.getModelBoundsAt(model, x, z)
    if (!modelBoundingBox) return { x, z }

    let clampedX = x
    let clampedZ = z

    // 인셋 적용된 경계 (일관성 있게 적용)
    const minX = floorBounds.minX + inset
    const maxX = floorBounds.maxX - inset
    const minZ = floorBounds.minZ + inset
    const maxZ = floorBounds.maxZ - inset

    // X축 클램핑 (인셋 적용된 경계 기준)
    if (modelBoundingBox.min.x < minX) {
      clampedX = x + (minX - modelBoundingBox.min.x)
    } else if (modelBoundingBox.max.x > maxX) {
      clampedX = x - (modelBoundingBox.max.x - maxX)
    }

    // Z축 클램핑 (인셋 적용된 경계 기준)
    if (modelBoundingBox.min.z < minZ) {
      clampedZ = z + (minZ - modelBoundingBox.min.z)
    } else if (modelBoundingBox.max.z > maxZ) {
      clampedZ = z - (modelBoundingBox.max.z - maxZ)
    }

    return { x: clampedX, z: clampedZ }
  }

  // 통합된 Y 좌표 계산 메소드
  private calculateYPosition(
    model: BaseModel,
    x: number,
    z: number,
    mode: 'floor-only' | 'with-models' = 'with-models',
    excludeModelIds: string[] = []
  ): number {
    const modelBottomOffset = this.getModelBottomOffset(model)
    
    if (mode === 'floor-only') {
      // 바닥 높이만 고려
      const floorY = this.getFloorHeight(x, z)
      return floorY - modelBottomOffset
    }
    
    // 바닥 + 다른 모델들 고려 (통합된 raycasting 사용)
    const intersections = this.performFloorRaycast(x, z, {
      targets: 'all-colliders',
      targetModel: model,
      excludeModelIds
    })
    if (intersections.length > 0) {
      let bestSurfaceY = -Infinity
      for (const intersection of intersections) {
        const surfaceY = intersection.point.y
        const isFloorMesh = intersection.object.userData.isFloor
        if (isFloorMesh) {
          bestSurfaceY = Math.max(bestSurfaceY, surfaceY)
        } else {
          const surfaceModelId = intersection.object.userData.modelId
          const surfaceModel = this.models.get(surfaceModelId)
          if (surfaceModel && this.canModelSupportAnother(surfaceModel, model, x, z)) {
            bestSurfaceY = Math.max(bestSurfaceY, surfaceY)
          }
        }
      }
      if (bestSurfaceY > -Infinity) {
        return bestSurfaceY - modelBottomOffset
      }
    }

    // 폴백: 바닥 높이 사용
    const floorY = this.getFloorHeight(x, z)
    return floorY - modelBottomOffset
  }

  // 바닥 위 배치 Y 좌표 계산
  public calculateModelFloorY(model: BaseModel, x?: number, z?: number): number {
    const pos = model.getPosition()
    const targetX = x !== undefined ? x : pos.x
    const targetZ = z !== undefined ? z : pos.z
    return this.calculateYPosition(model, targetX, targetZ, 'floor-only')
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

  public canModelSupportAnother(supportModel: BaseModel, targetModel: BaseModel, targetX: number, targetZ: number): boolean {
    const supportModelGroup = supportModel.getModel()
    const targetModelGroup = targetModel.getModel()
    if (!supportModelGroup || !targetModelGroup) return false

    if (targetModel.getType() === 'wallcube') return false

    const unsupportableTypes = ['floorlamp']
    if (unsupportableTypes.includes(supportModel.getType())) return false

    const supportBox = calculateBoundingBox(supportModel)
    const targetBox = calculateBoundingBox(targetModel, targetX, targetZ)
    
    if (!supportBox || !targetBox) return false

    const xOverlap = Math.min(targetBox.max.x, supportBox.max.x) - Math.max(targetBox.min.x, supportBox.min.x)
    const zOverlap = Math.min(targetBox.max.z, supportBox.max.z) - Math.max(targetBox.min.z, supportBox.min.z)
    
    if (xOverlap <= 0 || zOverlap <= 0) return false

    const overlapArea = xOverlap * zOverlap
    const targetArea = (targetBox.max.x - targetBox.min.x) * (targetBox.max.z - targetBox.min.z)
    const supportArea = (supportBox.max.x - supportBox.min.x) * (supportBox.max.z - supportBox.min.z)

    let minOverlapRatio = 0.3
    let minSupportAreaRatio = 0.8

    const supportType = supportModel.getType()
    const targetType = targetModel.getType()
    const pairKey = `${supportType}->${targetType}`

    const forbiddenPairs = new Set<string>(['stool->chair', 'stool->desk', 'stool->stool'])
    if (forbiddenPairs.has(pairKey)) return false

    switch (pairKey) {
      case 'chair->stool':
      case 'chair->floorlamp':
        minOverlapRatio = 0.25
        minSupportAreaRatio = 0.6
        break
      case 'stool->floorlamp':
        minOverlapRatio = 0.2
        minSupportAreaRatio = 0.5
        break
    }

    const overlapRatio = overlapArea / targetArea
    if (overlapRatio < minOverlapRatio) return false
    if (supportArea < targetArea * minSupportAreaRatio) return false

    const targetCenterX = (targetBox.min.x + targetBox.max.x) / 2
    const targetCenterZ = (targetBox.min.z + targetBox.max.z) / 2
    const insideX = targetCenterX >= supportBox.min.x && targetCenterX <= supportBox.max.x
    const insideZ = targetCenterZ >= supportBox.min.z && targetCenterZ <= supportBox.max.z
    
    return insideX && insideZ
  }

  // 다른 모델 위 배치 Y 좌표 계산 (지지 관계 포함)
  public calculateSurfaceY(targetModel: BaseModel, x: number, z: number, excludeModelIds: string[] = []): number {
    return this.calculateYPosition(targetModel, x, z, 'with-models', excludeModelIds)
  }

  public canPlaceOnFloor(model: BaseModel, x: number, z: number): boolean {
    if (!this.hasFloorAt(x, z)) {
      return false
    }
    
    // 통합 메서드 사용
    const boundingBox = calculateBoundingBox(model, x, z)
    if (!boundingBox) return false
    
    // 가구 크기 계산
    const width = boundingBox.max.x - boundingBox.min.x
    const depth = boundingBox.max.z - boundingBox.min.z
    const maxDimension = Math.max(width, depth)
    
    // 가구 크기에 따른 체크 간격 결정 (L자형, T자형 바닥의 빈 공간 감지)
    const checkStep = Math.min(0.25, Math.max(0.1, maxDimension / 8))
    
    const pointsToCheck: { x: number, z: number }[] = []
    
    // 4개 모서리는 반드시 포함
    pointsToCheck.push(
      { x: boundingBox.min.x, z: boundingBox.min.z },
      { x: boundingBox.max.x, z: boundingBox.min.z },
      { x: boundingBox.min.x, z: boundingBox.max.z },
      { x: boundingBox.max.x, z: boundingBox.max.z }
    )
    
    // 가구가 작지 않은 경우 중간 지점들도 체크 (L자, T자형 바닥의 빈 공간 감지 강화)
    if (width > checkStep * 2 || depth > checkStep * 2) {
      // 중앙점과 1/4, 3/4 지점들 추가
      const centerX = (boundingBox.min.x + boundingBox.max.x) / 2
      const centerZ = (boundingBox.min.z + boundingBox.max.z) / 2
      const quarterX1 = boundingBox.min.x + width * 0.25
      const quarterX2 = boundingBox.min.x + width * 0.75
      const quarterZ1 = boundingBox.min.z + depth * 0.25
      const quarterZ2 = boundingBox.min.z + depth * 0.75
      
      pointsToCheck.push(
        { x: centerX, z: centerZ },           // 정중앙 (가장 중요)
        { x: quarterX1, z: quarterZ1 },       // 1/4 지점들
        { x: quarterX1, z: quarterZ2 },
        { x: quarterX2, z: quarterZ1 },
        { x: quarterX2, z: quarterZ2 },
        { x: centerX, z: quarterZ1 },         // 중앙선상 1/4, 3/4
        { x: centerX, z: quarterZ2 },
        { x: quarterX1, z: centerZ },
        { x: quarterX2, z: centerZ }
      )
      
      // 큰 가구의 경우 더 세밀한 그리드 검사
      if (width > checkStep * 4 && depth > checkStep * 4) {
        for (let testX = boundingBox.min.x + checkStep; testX < boundingBox.max.x; testX += checkStep) {
          for (let testZ = boundingBox.min.z + checkStep; testZ < boundingBox.max.z; testZ += checkStep) {
            pointsToCheck.push({ x: testX, z: testZ })
          }
        }
      }
    }
    
    // 중복 제거 (1cm 이내 거리는 같은 점으로 간주)
    const uniquePoints = pointsToCheck.filter((point, index, self) => 
      index === self.findIndex(p => 
        Math.abs(p.x - point.x) < 0.01 && Math.abs(p.z - point.z) < 0.01
      )
    )
    
    // 모든 체크 포인트에 바닥이 있어야 함 (L자형, T자형 바닥의 빈 공간 차단)
    const validPoints = uniquePoints.filter(point => this.hasFloorAt(point.x, point.z))
    
    // 모든 포인트가 바닥 위에 있어야 함 (100% 엄격한 검사)
    if (validPoints.length !== uniquePoints.length) {
      return false
    }
    
    return true
  }

  public placeOnFloor(model: BaseModel, x: number, z: number): void {
    if (!this.canPlaceOnFloor(model, x, z)) {
      throw new Error('Cannot place furniture at this position - no valid floor')
    }
    let targetX = x
    let targetZ = z
    // 겹침 시 주변 유효 위치로 밀어내기
    if (this.hasCollisionWithExistingModels(model, targetX, targetZ)) {
      const near = this.findNearestValidPositionNear(model, targetX, targetZ)
      if (near) {
        targetX = near.x
        targetZ = near.z
      }
    }
    const surfaceY = this.calculateSurfaceY(model, targetX, targetZ)
    model.setPosition({ x: targetX, y: surfaceY, z: targetZ })
  }

  // 통합된 위치 조정 메서드 (충돌 검사, 경계 클램핑, Y 좌표 계산 포함)
  public calculateAdjustedPosition(targetModel: BaseModel, newX: number, newY: number, newZ: number): { x: number, y: number, z: number } {
    const targetModelGroup = targetModel.getModel()
    if (!targetModelGroup) {
      return { x: newX, y: Math.max(0, newY), z: newZ }
    }
    
    if (!this.hasFloorMeshes()) {
      const currentPosition = targetModel.getPosition()
      return { x: currentPosition.x, y: Math.max(0, currentPosition.y), z: currentPosition.z }
    }

    // 1. 경계 내로 클램핑
    const clampedPosition = this.clampToBounds(targetModel, newX, newZ)
    let adjustedX = clampedPosition.x
    let adjustedZ = clampedPosition.z

    // 2. L자형/T자형 바닥 검증 (빈 공간 차단)
    if (!this.canPlaceOnFloor(targetModel, adjustedX, adjustedZ)) {
      const nearestValid = this.findNearestValidPositionNear(targetModel, adjustedX, adjustedZ)
      if (nearestValid) {
        adjustedX = nearestValid.x
        adjustedZ = nearestValid.z
      } else {
        // 배치할 수 없으면 현재 위치 유지
        const currentPosition = targetModel.getPosition()
        return { x: currentPosition.x, y: Math.max(0, currentPosition.y), z: currentPosition.z }
      }
    }

    // 3. 다른 모델과의 충돌 검사 및 회피
    if (this.hasCollisionWithExistingModels(targetModel, adjustedX, adjustedZ)) {
      const nearestValid = this.findNearestValidPositionNear(targetModel, adjustedX, adjustedZ)
      if (nearestValid) {
        adjustedX = nearestValid.x
        adjustedZ = nearestValid.z
      }
    }

    // 4. 최적 Y 좌표 계산
    try {
      const surfaceY = this.calculateSurfaceY(targetModel, adjustedX, adjustedZ)
      return { x: adjustedX, y: Math.max(0, surfaceY), z: adjustedZ }
    } catch {
      const currentPosition = targetModel.getPosition()
      return { x: currentPosition.x, y: Math.max(0, currentPosition.y), z: currentPosition.z }
    }
  }

  // 가구 이동 후 재계산 로직 (지지 관계 변화 감지)
  public async recalculateOtherModelPositions(excludeModelId: string, previousPosition?: { x: number, y: number, z: number }): Promise<void> {
    const draggedModel = this.models.get(excludeModelId)
    if (!draggedModel) return
    
    const currentPosition = draggedModel.getPosition()
    const affectedModels = new Set<string>()
    
    // 1. 현재 지지하고 있는 모델들 찾기 (더 넓은 범위로 확장)
    this.models.forEach((model, id) => {
      if (id === excludeModelId || model.getType() === 'wallcube') return  // 벽 가구는 항상 벽에 붙음
      
      const modelPosition = model.getPosition()
      
      // 이동된 모델보다 위에 있고 가까운 모델들 (범위 확장: 1.5m → 3.0m)
      const dx = modelPosition.x - currentPosition.x
      const dz = modelPosition.z - currentPosition.z
      const horizontalDistance = Math.sqrt(dx * dx + dz * dz)
      
      if (modelPosition.y > currentPosition.y + 0.1 && horizontalDistance <= 3.0) {
        // 현재 위치에서 지지 관계 확인
        const isCurrentlySupported = this.canModelSupportAnother(draggedModel, model, modelPosition.x, modelPosition.z)
        
        if (isCurrentlySupported) {
          affectedModels.add(id)
        } else {
          // 현재 지지되지 않지만, 이전 위치에서 지지받고 있었을 수 있음
          if (previousPosition) {
            const prevDx = modelPosition.x - previousPosition.x
            const prevDz = modelPosition.z - previousPosition.z
            const prevDistance = Math.sqrt(prevDx * prevDx + prevDz * prevDz)
            
            if (prevDistance <= 3.0 && modelPosition.y > previousPosition.y + 0.1) {
              // 이전 위치에서 지지받고 있었는지 확인
              // Y 값도 임시로 변경해야 바운딩박스가 정확하게 계산됨
              const originalPos = draggedModel.getPosition()
              draggedModel.setPosition(previousPosition)
              
              const wasSupported = this.canModelSupportAnother(draggedModel, model, modelPosition.x, modelPosition.z)
              
              // 원래 위치로 복원
              draggedModel.setPosition(originalPos)
              
              if (wasSupported) {
                affectedModels.add(id)
              }
            }
          }
        }
      }
    })
    
    // 2. 영향받는 모델들 재계산
    const candidateIds = Array.from(affectedModels)
    if (candidateIds.length > 0) {
      await this.recalculateAffectedModelPositions(candidateIds)
    }
  }

  public findModelsAffectedByRemoval(removedModelId: string): string[] {
    const removedModel = this.models.get(removedModelId)
    if (!removedModel) return []
    
    const affectedModels: string[] = []
    const removedPosition = removedModel.getPosition()
    
    // 더 넓은 영향 범위: 제거된 모델 주변 반경 3m 내의 모델 고려
    const maxDistance = 3.0
    
    // 모든 모델을 순회하여 지지받을 수 있는 모델 찾기
    this.models.forEach((model, modelId) => {
      if (modelId === removedModelId || model.getType() === 'wallcube') return
      
              const modelPosition = model.getPosition()
      
      // 거리 제한: 영향 범위 내 모델만 고려
      const distance = Math.sqrt(
        Math.pow(modelPosition.x - removedPosition.x, 2) + 
        Math.pow(modelPosition.z - removedPosition.z, 2)
      )
      if (distance > maxDistance) return
      
      // 제거된 모델보다 위에 있는 모델만 확인 (높이 차이를 더 완화)
      const heightDifference = modelPosition.y - removedPosition.y
      if (heightDifference > 0.005) {  // 0.5cm 이상 차이
        // 1단계: 지지 관계 확인 (더 관대하게)
        const isActuallySupported = this.canModelSupportAnother(removedModel, model, modelPosition.x, modelPosition.z)
        
        // 2단계: 지지 관계가 없어도 높이가 비슷하고 가까우면 영향받을 수 있음
        const isSuspiciouslyClose = distance < 1.0 && heightDifference < 1.0 && heightDifference > 0.1
        
        if (isActuallySupported || isSuspiciouslyClose) {
          // 제거된 모델 외에 다른 지지가 있는지 확인
          const hasOtherSupport = this.hasAlternativeSupport(model, removedModelId)
          
          if (!hasOtherSupport) {
            affectedModels.push(modelId)
          }
        }
      }
    })
    
    return affectedModels
  }
  
  // 다른 지지 모델이 있는지 확인하는 헬퍼 메서드
  private hasAlternativeSupport(targetModel: BaseModel, excludeModelId: string): boolean {
    const targetPosition = targetModel.getPosition()
    
    // 1. 바닥 지지 확인 (가장 기본적인 지지)
    const canPlaceOnFloor = this.canPlaceOnFloor(targetModel, targetPosition.x, targetPosition.z)
    
    if (canPlaceOnFloor) {
      // 바닥에 직접 배치할 수 있으면 다른 지지가 있다고 판단
      return true
    }
    
    // 2. 다른 모델의 지지 확인
    for (const [modelId, model] of this.models) {
      if (modelId === excludeModelId || modelId === targetModel.getId() || model.getType() === 'wallcube') {
        continue
      }
      
      const modelPosition = model.getPosition()
      
      // 타겟 모델보다 아래에 있고 (높이 조건 완화)
      if (modelPosition.y < targetPosition.y - 0.01) {
        // 지지 관계가 성립하면
        if (this.canModelSupportAnother(model, targetModel, targetPosition.x, targetPosition.z)) {
          return true
        }
      }
    }
    
    return false
  }

  // 최적의 지지 모델을 찾는 헬퍼 메서드
  private findBestSupportingModel(targetModel: BaseModel, x: number, z: number, excludeModelIds: string[] = []): BaseModel | null {
    let bestSupportingModel: BaseModel | null = null
    let highestSurfaceY = -Infinity
    
    for (const [modelId, model] of this.models) {
      if (excludeModelIds.includes(modelId) || 
          modelId === targetModel.getId() || 
          model.getType() === 'wallcube' ||
          !model.isModelLoaded()) {
        continue
      }
      
      // 지지 관계가 성립하는지 확인
      if (this.canModelSupportAnother(model, targetModel, x, z)) {
        const boundingBox = calculateBoundingBox(model)
        if (boundingBox) {
          const surfaceY = boundingBox.max.y
          
          // 가장 높은 지지 표면을 가진 모델 선택
          if (surfaceY > highestSurfaceY) {
            highestSurfaceY = surfaceY
            bestSupportingModel = model
          }
        }
      }
    }
    
    return bestSupportingModel
  }

  public async recalculateAffectedModelPositions(affectedModelIds: string[]): Promise<void> {
    if (affectedModelIds.length === 0) return
    
    const sortedModels = affectedModelIds
      .map(id => ({ id, model: this.models.get(id)! }))
      .filter(item => item.model && item.model.isModelLoaded())
      .sort((a, b) => a.model.getPosition().y - b.model.getPosition().y)
    
    // 각 모델을 개별적으로 안전하게 재배치
    for (const { id, model } of sortedModels) {
      const currentPosition = model.getPosition()
      
      try {
        // 현재 위치에서 지지할 수 있는 다른 모델 찾기
        const supportingModel = this.findBestSupportingModel(model, currentPosition.x, currentPosition.z, [id])
        
        if (supportingModel) {
          // 다른 모델 위에 배치
          const surfaceY = this.calculateSurfaceY(model, currentPosition.x, currentPosition.z, [id])
          model.setPosition({ x: currentPosition.x, y: surfaceY, z: currentPosition.z })
        } else if (this.canPlaceOnFloor(model, currentPosition.x, currentPosition.z)) {
          // 바닥에 배치
          const floorY = this.calculateModelFloorY(model, currentPosition.x, currentPosition.z)
          model.setPosition({ x: currentPosition.x, y: floorY, z: currentPosition.z })
        } else {
          // 현재 위치에 배치할 수 없음 - 가까운 유효 위치 찾기
          const nearestValid = this.findNearestValidPositionNear(model, currentPosition.x, currentPosition.z)
          if (nearestValid) {
            const newY = this.calculateSurfaceY(model, nearestValid.x, nearestValid.z, [id])
            model.setPosition({ x: nearestValid.x, y: newY, z: nearestValid.z })
          } else {
            // 최후 수단: 바닥의 안전한 위치에 배치
            const optimalPosition = this.findOptimalPlacement(model)
            if (optimalPosition) {
              model.setPosition(optimalPosition)
            }
          }
        }
        
        // Matrix 업데이트로 Three.js 상태 동기화
        const threeModel = model.getModel()
        if (threeModel) {
          threeModel.updateMatrixWorld(true)
        }
        
        // 다음 모델 처리 전 약간의 지연
        await new Promise(resolve => setTimeout(resolve, 5))
        
      } catch {
        // 실패 시 안전한 기본 위치로 복원
        try {
          const safeY = this.calculateModelFloorY(model, currentPosition.x, currentPosition.z)
          model.setPosition({ x: currentPosition.x, y: safeY, z: currentPosition.z })
        } catch {
          // 최후의 수단: 원래 위치 유지
        }
      }
      
      // 각 모델의 바운딩박스 업데이트
      if (this.visualizer.isEnabled()) {
        this.visualizer.updateHelper(model)
      }
    }
  }

  // 전역 최적 배치 위치 찾기 (Y 좌표 포함)
  public findOptimalPlacement(model: BaseModel): { x: number, y: number, z: number } | null {
    const modelGroup = model.getModel()
    if (!modelGroup) {
      return null
    }

    const originalPos = modelGroup.position.clone()
    
    try {
      // 통합된 위치 찾기 메서드 사용 (Y 좌표 포함, 더 정밀한 그리드)
      const result = this.findValidPosition(model, { 
        includeY: true,
        gridSize: 0.2,  // 더 정밀한 그리드 (20cm 간격)
        stepMultiplier: 6
      })
      
      if (result && 'y' in result) {
        return result as { x: number, y: number, z: number }
      }
      
      return null
    } finally {
      // 원래 위치 복원
      modelGroup.position.copy(originalPos)
    }
  }

  private generateSearchPositions(
    bounds: { minX: number, maxX: number, minZ: number, maxZ: number },
    options: {
      centerX?: number,
      centerZ?: number, 
      gridSize?: number,
      stepMultiplier?: number
    } = {}
  ): { x: number, z: number }[] {
    const positions: { x: number, z: number }[] = []
    
    // 기본값 설정
    const centerX = options.centerX ?? (bounds.minX + bounds.maxX) / 2
    const centerZ = options.centerZ ?? (bounds.minZ + bounds.maxZ) / 2
    const gridSize = options.gridSize ?? 0.5
    const stepMultiplier = options.stepMultiplier ?? 4
    
    // 중심점 추가
    positions.push({ x: centerX, z: centerZ })
    
    let radius = gridSize
    const maxRadius = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) / 2
    
    while (radius <= maxRadius) {
      const steps = Math.max(8, Math.floor(radius * stepMultiplier))
      for (let i = 0; i < steps; i++) {
        const angle = (i / steps) * Math.PI * 2
        const x = centerX + Math.cos(angle) * radius
        const z = centerZ + Math.sin(angle) * radius
        if (x >= bounds.minX && x <= bounds.maxX && z >= bounds.minZ && z <= bounds.maxZ) {
          positions.push({ x, z })
        }
      }
      radius += gridSize
    }
    return positions
  }

  public hasCollisionWithExistingModels(testModel: BaseModel, x: number, z: number): boolean {
    // 통합 메서드 사용
    const testBounds = calculateBoundingBox(testModel, x, z)
    if (!testBounds) return false
    
    let hasCollision = false
    this.models.forEach((existingModel) => {
      if (existingModel.getId() === testModel.getId()) return
      
      const existingBounds = calculateBoundingBox(existingModel)
      if (!existingBounds) return
      
      const xOverlap = testBounds.max.x >= existingBounds.min.x && testBounds.min.x <= existingBounds.max.x
      const zOverlap = testBounds.max.z >= existingBounds.min.z && testBounds.min.z <= existingBounds.max.z
      const yOverlap = testBounds.max.y >= existingBounds.min.y && testBounds.min.y <= existingBounds.max.y
      
      if (xOverlap && zOverlap && yOverlap) {
        // 지지 관계가 성립하면 충돌 아님
        if (this.canModelSupportAnother(existingModel, testModel, x, z)) {
          // OK - 지지 관계
        } else {
          // 충돌!
          hasCollision = true
        }
      }
    })
    
    return hasCollision
  }

  // 주어진 시작점 근처에서 유효한 위치 찾기 (충돌 회피용)
  public findNearestValidPositionNear(model: BaseModel, startX: number, startZ: number): { x: number, z: number } | null {
    return this.findValidPosition(model, { 
      centerX: startX, 
      centerZ: startZ, 
      stepMultiplier: 8,
      gridSize: 0.1  // 더 정밀한 그리드 (10cm 간격)
    })
  }

  // 통합된 유효 위치 찾기 메서드
  private findValidPosition(
    model: BaseModel, 
    options: {
      centerX?: number,
      centerZ?: number,
      stepMultiplier?: number,
      gridSize?: number,
      includeY?: boolean
    } = {}
  ): { x: number, z: number } | { x: number, y: number, z: number } | null {
    const bounds = this.getFloorBounds()
    if (!bounds) return null

    const { centerX, centerZ, stepMultiplier = 4, gridSize = 0.5, includeY = false } = options
    const searchCenterX = centerX ?? (bounds.minX + bounds.maxX) / 2
    const searchCenterZ = centerZ ?? (bounds.minZ + bounds.maxZ) / 2

    const candidates = this.generateSearchPositions(bounds, {
      centerX: searchCenterX,
      centerZ: searchCenterZ,
      stepMultiplier,
      gridSize
    })

    for (const pos of candidates) {
      if (!this.canPlaceOnFloor(model, pos.x, pos.z)) continue
      if (this.hasCollisionWithExistingModels(model, pos.x, pos.z)) continue
      
      if (includeY) {
        try {
          const y = this.calculateSurfaceY(model, pos.x, pos.z)
          return { x: pos.x, y, z: pos.z }
        } catch {
          continue
        }
      }
      
      return { x: pos.x, z: pos.z }
    }
    
    return null
  }

  public async repositionModelsAfterFloorChange(): Promise<string[]> {
    const idsToDelete: string[] = []
    // 바닥이 전혀 없는 경우: 모든 바닥 가구 삭제 대상으로 반환
    if (!this.hasFloorMeshes()) {
      Array.from(this.models.values()).forEach(model => {
        if (model.getType() !== 'wallcube') {
          idsToDelete.push(model.getId())
        }
      })
      return idsToDelete
    }

    const floorModels = Array.from(this.models.values()).filter(model => model.getType() !== 'wallcube' && model.isModelLoaded())
    // 아래에서 위로 쌓이는 순서로 재배치
    floorModels.sort((a, b) => a.getPosition().y - b.getPosition().y)
    for (const model of floorModels) {
      const current = model.getPosition()
      try {
        if (this.canPlaceOnFloor(model, current.x, current.z)) {
          const newY = this.calculateSurfaceY(model, current.x, current.z)
          model.setPosition({ x: current.x, y: newY, z: current.z })
          model.setVisible(true)
        } else {
          // 가까운 유효 위치 탐색
          const near = this.findNearestValidPositionNear(model, current.x, current.z)
          if (near) {
            const newY = this.calculateSurfaceY(model, near.x, near.z)
            model.setPosition({ x: near.x, y: newY, z: near.z })
            model.setVisible(true)
          } else {
            // 마지막 폴백: 전역 최적 위치 탐색
            const optimal = this.findOptimalPlacement(model)
            if (optimal) {
              model.setPosition(optimal)
              model.setVisible(true)
            } else {
              // 배치 불가: 삭제 대상 목록에 추가
              idsToDelete.push(model.getId())
            }
          }
        }
        const threeModel = model.getModel()
        if (threeModel) {
          threeModel.updateMatrixWorld(true)
        }
        // 프레임 반영 대기 (비동기 렌더 루프 환경에서 안전성)
        await new Promise(resolve => setTimeout(resolve, 5))
      } catch {
        // 무시: 해당 모델은 일시적으로 배치 불가할 수 있음
      }
    }
    return idsToDelete
  }

  // 바운딩박스 시각화 메서드들 (Visualizer로 위임)
  public enableBoundingBoxVisualization(): void {
    this.visualizer.enable((model) => model.getType() !== 'wallcube')
  }

  public disableBoundingBoxVisualization(): void {
    this.visualizer.disable()
  }

  public toggleBoundingBoxVisualization(): boolean {
    this.visualizer.toggle((model) => model.getType() !== 'wallcube')
    return this.visualizer.isEnabled()
  }

  public updateAllBoundingBoxHelpers(): void {
    this.visualizer.updateAll((model) => model.getType() !== 'wallcube')
  }

  public updateModelBoundingBox(modelId: string): void {
    this.visualizer.updateModel(modelId)
  }
}
