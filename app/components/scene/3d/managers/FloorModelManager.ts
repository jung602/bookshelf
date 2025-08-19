import * as THREE from 'three'
import { BaseModel } from '../objects/BaseModel'
import { SceneIndex } from './SceneIndex'

export class FloorModelManager {
  private scene: THREE.Scene
  private models: Map<string, BaseModel>
  private sceneIndex: SceneIndex

  constructor(scene: THREE.Scene, models: Map<string, BaseModel>, sceneIndex: SceneIndex) {
    this.scene = scene
    this.models = models
    this.sceneIndex = sceneIndex
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
      
      return model.getId()
    } catch (error) {
      console.error('Failed to add floor model:', error)
      throw error
    }
  }

  // 바닥 가구 회전
  public rotateFloorModel(modelId: string): void {
    const model = this.models.get(modelId)
    if (model && model.getType() !== 'wallcube') {
      model.rotateY90()
      // 회전 후 재배치 및 충돌 안정화
      const pos = model.getPosition()
      try {
        this.placeOnFloor(model, pos.x, pos.z)
      } catch {
        const clamped = this.clampToBounds(model, pos.x, pos.z)
        const newY = this.calculateSurfaceY(model, clamped.x, clamped.z)
        model.setPosition({ x: clamped.x, y: newY, z: clamped.z })
      }
      // 다른 모델들 재계산
      this.recalculateOtherModelPositions(modelId)
    }
  }

  // 바닥 가구 이동 (충돌 검사 및 조정 포함)
  public moveFloorModel(modelId: string, x: number, z: number): void {
    const model = this.models.get(modelId)
    if (!model || model.getType() === 'wallcube') return

    if (!this.hasFloorMeshes()) {
      return
    }

    // checkCollisionAndAdjust와 통합된 로직 사용
    const adjustedPosition = this.calculateAdjustedPosition(model, x, 0, z)
    model.setPosition(adjustedPosition)
  }

  public hasFloorMeshes(): boolean {
    return this.sceneIndex.getFloorMeshes().length > 0
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

    const raycaster = new THREE.Raycaster()
    const rayOrigin = new THREE.Vector3(x, rayOriginY, z)
    const rayDirection = new THREE.Vector3(0, -1, 0)
    raycaster.set(rayOrigin, rayDirection)

    let colliders: THREE.Mesh[] = []

    if (targets === 'all-colliders' && targetModel) {
      // 다른 모델들의 콜라이더 포함
      this.models.forEach((otherModel, modelId) => {
        if (modelId !== targetModel.getId() &&
            !excludeModelIds.includes(modelId) &&
            otherModel.isModelLoaded() &&
            otherModel.getType() !== 'wallcube' &&
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

    return raycaster.intersectObjects(colliders, false)
  }

  // 모델 바운딩 박스 계산 헬퍼
  private getModelBoundsAt(model: BaseModel, x: number, z: number): THREE.Box3 | null {
    const modelGroup = model.getModel()
    if (!modelGroup) return null

    const originalPos = modelGroup.position.clone()
    modelGroup.position.set(x, 0, z)
    const boundingBox = new THREE.Box3().setFromObject(modelGroup)
    modelGroup.position.copy(originalPos)
    
    return boundingBox
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

    // 인셋 적용된 경계
    const minX = floorBounds.minX + inset
    const maxX = floorBounds.maxX - inset
    const minZ = floorBounds.minZ + inset
    const maxZ = floorBounds.maxZ - inset

    if (modelBoundingBox.min.x < floorBounds.minX) {
      clampedX = x + (minX - modelBoundingBox.min.x)
    } else if (modelBoundingBox.max.x > floorBounds.maxX) {
      clampedX = x - (modelBoundingBox.max.x - maxX)
    }

    if (modelBoundingBox.min.z < floorBounds.minZ) {
      clampedZ = z + (minZ - modelBoundingBox.min.z)
    } else if (modelBoundingBox.max.z > floorBounds.maxZ) {
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
    const modelGroup = model.getModel()
    if (!modelGroup) { return 0 }
    
    const boundingBox = new THREE.Box3().setFromObject(modelGroup)
    const bottomOffset = boundingBox.min.y - modelGroup.position.y
    
    return bottomOffset
  }

  public canModelSupportAnother(supportModel: BaseModel, targetModel: BaseModel, targetX: number, targetZ: number): boolean {
    const supportModelGroup = supportModel.getModel()
    const targetModelGroup = targetModel.getModel()
    if (!supportModelGroup || !targetModelGroup) return false

    // 1) 타입 정책: 아래 타입들은 어떤 모델도 지지하지 않음
    const unsupportableTypes = ['floorlamp', 'wallcube']
    if (unsupportableTypes.includes(supportModel.getType())) { return false }

    const supportBox = new THREE.Box3().setFromObject(supportModelGroup)
    const originalTargetPosition = targetModelGroup.position.clone()
    targetModelGroup.position.set(targetX, 0, targetZ)
    const targetBox = new THREE.Box3().setFromObject(targetModelGroup)
    targetModelGroup.position.copy(originalTargetPosition)

    const xOverlap = Math.min(targetBox.max.x, supportBox.max.x) - Math.max(targetBox.min.x, supportBox.min.x)
    const zOverlap = Math.min(targetBox.max.z, supportBox.max.z) - Math.max(targetBox.min.z, supportBox.min.z)
    if (xOverlap <= 0 || zOverlap <= 0) { return false }

    // 2) 면적 기반 제약: 지지 모델의 발자국 면적이 타겟보다 충분히 커야 함 (페어별 예외 허용)
    const overlapArea = xOverlap * zOverlap
    const targetArea = (targetBox.max.x - targetBox.min.x) * (targetBox.max.z - targetBox.min.z)
    const supportArea = (supportBox.max.x - supportBox.min.x) * (supportBox.max.z - supportBox.min.z)

    // 최소 겹침 비율과 최소 지지 면적 비율 (기본값)
    let minOverlapRatio = 0.3
    let minSupportAreaRatio = 0.8 // 지지 모델 면적이 타겟의 80% 이상이어야 지지 가능

    // 페어별 금지/완화 규칙
    const supportType = supportModel.getType()
    const targetType = targetModel.getType()
    const pairKey = `${supportType}->${targetType}`

    // 명시적 금지 페어
    const forbiddenPairs = new Set<string>([
      'stool->chair', // 스툴 위에 의자 금지
    ])
    if (forbiddenPairs.has(pairKey)) {
      return false
    }

    // 완화 규칙
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
      default:
        break
    }

    const overlapRatio = overlapArea / targetArea
    if (overlapRatio < minOverlapRatio) return false
    if (supportArea < targetArea * minSupportAreaRatio) return false

    // 3) 안정성: 타겟 중심점이 지지 모델 발자국 안에 있어야 함
    const targetCenterX = (targetBox.min.x + targetBox.max.x) / 2
    const targetCenterZ = (targetBox.min.z + targetBox.max.z) / 2
    const insideX = targetCenterX >= supportBox.min.x && targetCenterX <= supportBox.max.x
    const insideZ = targetCenterZ >= supportBox.min.z && targetCenterZ <= supportBox.max.z
    if (!(insideX && insideZ)) return false

    
    return true
  }

  // 다른 모델 위 배치 Y 좌표 계산 (지지 관계 포함)
  public calculateSurfaceY(targetModel: BaseModel, x: number, z: number, excludeModelIds: string[] = []): number {
    return this.calculateYPosition(targetModel, x, z, 'with-models', excludeModelIds)
  }

  public canPlaceOnFloor(model: BaseModel, x: number, z: number): boolean {
    if (!this.hasFloorAt(x, z)) {
      return false
    }
    const modelGroup = model.getModel()
    if (!modelGroup) return false
    const originalPos = modelGroup.position.clone()
    modelGroup.position.set(x, 0, z)
    const boundingBox = new THREE.Box3().setFromObject(modelGroup)
    modelGroup.position.copy(originalPos)
    const corners = [
      { x: boundingBox.min.x, z: boundingBox.min.z },
      { x: boundingBox.max.x, z: boundingBox.min.z },
      { x: boundingBox.min.x, z: boundingBox.max.z },
      { x: boundingBox.max.x, z: boundingBox.max.z }
    ]
    const validCorners = corners.filter(corner => this.hasFloorAt(corner.x, corner.z))
    if (validCorners.length !== corners.length) {
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

    // 2. 다른 모델과의 충돌 검사 및 회피
    if (this.hasCollisionWithExistingModels(targetModel, adjustedX, adjustedZ)) {
      const nearestValid = this.findNearestValidPositionNear(targetModel, adjustedX, adjustedZ)
      if (nearestValid) {
        adjustedX = nearestValid.x
        adjustedZ = nearestValid.z
      }
    }

    // 3. 최적 Y 좌표 계산
    try {
      const surfaceY = this.calculateSurfaceY(targetModel, adjustedX, adjustedZ)
      return { x: adjustedX, y: Math.max(0, surfaceY), z: adjustedZ }
    } catch {
      const currentPosition = targetModel.getPosition()
      return { x: currentPosition.x, y: Math.max(0, currentPosition.y), z: currentPosition.z }
    }
  }

  // 호환성을 위한 레거시 메서드
  public checkCollisionAndAdjust(targetModel: BaseModel, newX: number, newY: number, newZ: number): { x: number, y: number, z: number } {
    return this.calculateAdjustedPosition(targetModel, newX, newY, newZ)
  }

  // 재배치 로직들
  public async recalculateOtherModelPositions(excludeModelId: string): Promise<void> {
    // 이동된 모델이 실제로 다른 모델을 지지하고 있는지만 확인
    const draggedModel = this.models.get(excludeModelId)
    if (!draggedModel) return
    
    const draggedPosition = draggedModel.getPosition()
    const candidateIds: string[] = []
    
    this.models.forEach((model, id) => {
      if (id === excludeModelId || model.getType() === 'wallcube') return
      
      const modelPosition = model.getPosition()
      
      // 1. 이동된 모델보다 위에 있는 모델만 확인
      if (modelPosition.y <= draggedPosition.y + 0.1) return
      
      // 2. 수평 거리가 가까운 모델만 확인 (1m 반경)
      const dx = modelPosition.x - draggedPosition.x
      const dz = modelPosition.z - draggedPosition.z
      const horizontalDistance = Math.sqrt(dx * dx + dz * dz)
      if (horizontalDistance > 1.0) return
      
      // 3. 실제로 지지 관계가 있는지 확인
      if (this.canModelSupportAnother(draggedModel, model, modelPosition.x, modelPosition.z)) {
        candidateIds.push(id)
      }
    })
    
    // 실제로 지지받고 있던 모델만 재계산
    if (candidateIds.length > 0) {
      console.log(`[recalculateOtherModelPositions] Found ${candidateIds.length} models actually supported by moved model`)
      await this.recalculateAffectedModelPositions(candidateIds, draggedPosition)
    } else {
      console.log(`[recalculateOtherModelPositions] No models were actually supported by moved model`)
    }
  }

  public findModelsAffectedByRemoval(removedModelId: string): string[] {
    const removedModel = this.models.get(removedModelId)
    if (!removedModel) return []
    
    const affectedModels: string[] = []
    const removedPosition = removedModel.getPosition()
    
    console.log(`[findModelsAffectedByRemoval] Analyzing removal of ${removedModel.getType()} at (${removedPosition.x.toFixed(2)}, ${removedPosition.y.toFixed(2)}, ${removedPosition.z.toFixed(2)})`)
    
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
        console.log(`[findModelsAffectedByRemoval] Checking ${model.getType()} at (${modelPosition.x.toFixed(2)}, ${modelPosition.y.toFixed(2)}, ${modelPosition.z.toFixed(2)}), height diff: ${heightDifference.toFixed(3)}`)
        
        // 1단계: 지지 관계 확인 (더 관대하게)
        const isActuallySupported = this.canModelSupportAnother(removedModel, model, modelPosition.x, modelPosition.z)
        console.log(`[findModelsAffectedByRemoval] ${model.getType()} was supported by removed model: ${isActuallySupported}`)
        
        // 2단계: 지지 관계가 없어도 높이가 비슷하고 가까우면 영향받을 수 있음
        const isSuspiciouslyClose = distance < 1.0 && heightDifference < 1.0 && heightDifference > 0.1
        console.log(`[findModelsAffectedByRemoval] ${model.getType()} is suspiciously close: ${isSuspiciouslyClose}`)
        
        if (isActuallySupported || isSuspiciouslyClose) {
          // 제거된 모델 외에 다른 지지가 있는지 확인
          const hasOtherSupport = this.hasAlternativeSupport(model, removedModelId)
          console.log(`[findModelsAffectedByRemoval] ${model.getType()} has alternative support: ${hasOtherSupport}`)
          
          if (!hasOtherSupport) {
            console.log(`[findModelsAffectedByRemoval] Adding ${model.getType()} to affected models`)
            affectedModels.push(modelId)
          }
        }
      }
    })
    
    console.log(`[findModelsAffectedByRemoval] Found ${affectedModels.length} affected models:`, affectedModels)
    return affectedModels
  }
  
  // 다른 지지 모델이 있는지 확인하는 헬퍼 메서드
  private hasAlternativeSupport(targetModel: BaseModel, excludeModelId: string): boolean {
    const targetPosition = targetModel.getPosition()
    
    console.log(`[hasAlternativeSupport] Checking alternative support for ${targetModel.getType()} at (${targetPosition.x.toFixed(2)}, ${targetPosition.y.toFixed(2)}, ${targetPosition.z.toFixed(2)})`)
    
    // 1. 바닥 지지 확인 (가장 기본적인 지지)
    const canPlaceOnFloor = this.canPlaceOnFloor(targetModel, targetPosition.x, targetPosition.z)
    console.log(`[hasAlternativeSupport] Can place on floor: ${canPlaceOnFloor}`)
    
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
        console.log(`[hasAlternativeSupport] Checking support from ${model.getType()} at (${modelPosition.x.toFixed(2)}, ${modelPosition.y.toFixed(2)}, ${modelPosition.z.toFixed(2)})`)
        
        // 지지 관계가 성립하면
        if (this.canModelSupportAnother(model, targetModel, targetPosition.x, targetPosition.z)) {
          console.log(`[hasAlternativeSupport] Found alternative support from ${model.getType()}`)
          return true
        }
      }
    }
    
    console.log(`[hasAlternativeSupport] No alternative support found`)
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
        const modelPosition = model.getPosition()
        const modelGroup = model.getModel()
        if (modelGroup) {
          const boundingBox = new THREE.Box3().setFromObject(modelGroup)
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

  public async recalculateAffectedModelPositions(affectedModelIds: string[], removedPosition: { x: number; y: number; z: number }): Promise<void> {
    console.log(`[recalculateAffectedModelPositions] START - ${affectedModelIds.length} models to recalculate:`, affectedModelIds)
    
    if (affectedModelIds.length === 0) return
    
    const sortedModels = affectedModelIds
      .map(id => ({ id, model: this.models.get(id)! }))
      .filter(item => item.model && item.model.isModelLoaded())
      .sort((a, b) => a.model.getPosition().y - b.model.getPosition().y)
    
    // 각 모델을 개별적으로 안전하게 재배치
    for (const { id, model } of sortedModels) {
      const currentPosition = model.getPosition()
      console.log(`[recalculateAffectedModelPositions] Processing ${model.getType()} ${id} at (${currentPosition.x.toFixed(2)}, ${currentPosition.y.toFixed(2)}, ${currentPosition.z.toFixed(2)})`)
      
      try {
        // 현재 위치에서 지지할 수 있는 다른 모델 찾기
        const supportingModel = this.findBestSupportingModel(model, currentPosition.x, currentPosition.z, [id])
        
        if (supportingModel) {
          // 다른 모델 위에 배치
          const surfaceY = this.calculateSurfaceY(model, currentPosition.x, currentPosition.z, [id])
          console.log(`[recalculateAffectedModelPositions] ${model.getType()} placing on ${supportingModel.getType()} at Y: ${surfaceY.toFixed(3)}`)
          model.setPosition({ x: currentPosition.x, y: surfaceY, z: currentPosition.z })
        } else if (this.canPlaceOnFloor(model, currentPosition.x, currentPosition.z)) {
          // 바닥에 배치
          const floorY = this.calculateModelFloorY(model, currentPosition.x, currentPosition.z)
          console.log(`[recalculateAffectedModelPositions] ${model.getType()} placing on floor at Y: ${floorY.toFixed(3)}`)
          model.setPosition({ x: currentPosition.x, y: floorY, z: currentPosition.z })
        } else {
          // 현재 위치에 배치할 수 없음 - 가까운 유효 위치 찾기
          const nearestValid = this.findNearestValidPositionNear(model, currentPosition.x, currentPosition.z)
          if (nearestValid) {
            const newY = this.calculateSurfaceY(model, nearestValid.x, nearestValid.z, [id])
            console.log(`[recalculateAffectedModelPositions] ${model.getType()} relocating to (${nearestValid.x.toFixed(2)}, ${newY.toFixed(3)}, ${nearestValid.z.toFixed(2)})`)
            model.setPosition({ x: nearestValid.x, y: newY, z: nearestValid.z })
          } else {
            // 최후 수단: 바닥의 안전한 위치에 배치
            const optimalPosition = this.findOptimalPlacement(model)
            if (optimalPosition) {
              console.log(`[recalculateAffectedModelPositions] ${model.getType()} relocating to optimal position (${optimalPosition.x.toFixed(2)}, ${optimalPosition.y.toFixed(3)}, ${optimalPosition.z.toFixed(2)})`)
              model.setPosition(optimalPosition)
            } else {
              console.warn(`[recalculateAffectedModelPositions] Could not find valid position for ${model.getType()}`)
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
        
      } catch (error) {
        console.warn(`Failed to recalculate position for model ${id}:`, error)
        
        // 실패 시 안전한 기본 위치로 복원
        try {
          const safeY = this.calculateModelFloorY(model, currentPosition.x, currentPosition.z)
          model.setPosition({ x: currentPosition.x, y: safeY, z: currentPosition.z })
        } catch {
          // 최후의 수단: 원래 위치 유지
        }
      }
    }
    
    console.log(`[recalculateAffectedModelPositions] COMPLETE`)
  }

  // 전역 최적 배치 위치 찾기 (Y 좌표 포함)
  public findOptimalPlacement(model: BaseModel): { x: number, y: number, z: number } | null {
    const modelGroup = model.getModel()
    if (!modelGroup) {
      console.warn('findOptimalPlacement: Model group not found')
      return null
    }

    const originalPos = modelGroup.position.clone()
    
    try {
      // 통합된 위치 찾기 메서드 사용 (Y 좌표 포함)
      const result = this.findValidPosition(model, { includeY: true })
      
      if (result && 'y' in result) {
        return result as { x: number, y: number, z: number }
      }
      
      console.warn('findOptimalPlacement: No valid position found')
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
    const testModelGroup = testModel.getModel()
    if (!testModelGroup) return false
    const originalPos = testModelGroup.position.clone()
    testModelGroup.position.set(x, 0, z)
    const testBounds = new THREE.Box3().setFromObject(testModelGroup)
    let hasCollision = false
    this.models.forEach((existingModel) => {
      if (existingModel.getId() === testModel.getId()) return
      const existingGroup = existingModel.getModel()
      if (!existingGroup) return
      const existingBounds = new THREE.Box3().setFromObject(existingGroup)
      const xOverlap = testBounds.max.x >= existingBounds.min.x && testBounds.min.x <= existingBounds.max.x
      const zOverlap = testBounds.max.z >= existingBounds.min.z && testBounds.min.z <= existingBounds.max.z
      if (xOverlap && zOverlap) {
        if (this.canModelSupportAnother(existingModel, testModel, x, z)) {
          // OK
        } else {
          
          hasCollision = true
        }
      }
    })
    testModelGroup.position.copy(originalPos)
    return hasCollision
  }



  // 주어진 시작점 근처에서 유효한 위치 찾기 (충돌 회피용)
  private findNearestValidPositionNear(model: BaseModel, startX: number, startZ: number): { x: number, z: number } | null {
    return this.findValidPosition(model, { centerX: startX, centerZ: startZ, stepMultiplier: 6 })
  }

  // 통합된 유효 위치 찾기 메서드
  private findValidPosition(
    model: BaseModel, 
    options: {
      centerX?: number,
      centerZ?: number,
      stepMultiplier?: number,
      includeY?: boolean
    } = {}
  ): { x: number, z: number } | { x: number, y: number, z: number } | null {
    const bounds = this.getFloorBounds()
    if (!bounds) return null

    const { centerX, centerZ, stepMultiplier = 4, includeY = false } = options
    const searchCenterX = centerX ?? (bounds.minX + bounds.maxX) / 2
    const searchCenterZ = centerZ ?? (bounds.minZ + bounds.maxZ) / 2

    const candidates = this.generateSearchPositions(bounds, {
      centerX: searchCenterX,
      centerZ: searchCenterZ,
      stepMultiplier
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
}


