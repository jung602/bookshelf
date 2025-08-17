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

  public hasFloorMeshes(): boolean {
    return this.sceneIndex.getFloorMeshes().length > 0
  }

  public hasFloorAt(x: number, z: number): boolean {
    const raycaster = new THREE.Raycaster()
    const rayOrigin = new THREE.Vector3(x, 1, z)
    const rayDirection = new THREE.Vector3(0, -1, 0)
    raycaster.set(rayOrigin, rayDirection)

    const floorMeshes = this.sceneIndex.getFloorMeshes()
    const intersections = raycaster.intersectObjects(floorMeshes, false)
    return intersections.length > 0
  }

  public getFloorBounds(): { minX: number, maxX: number, minZ: number, maxZ: number } | null {
    return this.sceneIndex.getFloorBounds()
  }

  public getFloorHeight(x: number, z: number): number {
    const raycaster = new THREE.Raycaster()
    const rayOrigin = new THREE.Vector3(x, 10, z)  // 높은 곳에서 시작
    const rayDirection = new THREE.Vector3(0, -1, 0)
    raycaster.set(rayOrigin, rayDirection)

    const floorMeshes = this.sceneIndex.getFloorMeshes()
    const intersections = raycaster.intersectObjects(floorMeshes, false)
    const floorY = intersections.length > 0 ? intersections[0].point.y : 0
    
    console.log(`[getFloorHeight] at (${x.toFixed(2)}, ${z.toFixed(2)}) = ${floorY.toFixed(3)} (${intersections.length} intersections)`)
    
    return floorY
  }

  public clampToBounds(model: BaseModel, x: number, z: number, inset: number = 0): { x: number, z: number } {
    const modelGroup = model.getModel()
    if (!modelGroup) return { x, z }

    const floorBounds = this.getFloorBounds()
    if (!floorBounds) {
      
      return { x, z }
    }

    const originalPos = modelGroup.position.clone()
    modelGroup.position.set(x, 0, z)
    const modelBoundingBox = new THREE.Box3().setFromObject(modelGroup)
    modelGroup.position.copy(originalPos)

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

  public calculateModelFloorY(model: BaseModel, x?: number, z?: number): number {
    const pos = model.getPosition()
    const targetX = x !== undefined ? x : pos.x
    const targetZ = z !== undefined ? z : pos.z
    
    // 바닥 높이 계산
    const floorYAtPos = this.getFloorHeight(targetX, targetZ)
    
    // 모델의 바닥 오프셋 계산
    const bottomOffset = this.getModelBottomOffset(model)
    
    // 바닥 위에 정확히 배치
    const finalY = floorYAtPos - bottomOffset
    
    console.log(`[calculateModelFloorY] ${model.getType()} at (${targetX.toFixed(2)}, ${targetZ.toFixed(2)}) - floorY: ${floorYAtPos.toFixed(3)}, bottomOffset: ${bottomOffset.toFixed(3)}, finalY: ${finalY.toFixed(3)}`)
    
    return finalY
  }

  private getModelBottomOffset(model: BaseModel): number {
    const modelGroup = model.getModel()
    if (!modelGroup) { return 0 }
    
    const boundingBox = new THREE.Box3().setFromObject(modelGroup)
    const bottomOffset = boundingBox.min.y - modelGroup.position.y
    
    console.log(`[getModelBottomOffset] ${model.getType()} - bbox.min.y: ${boundingBox.min.y.toFixed(3)}, position.y: ${modelGroup.position.y.toFixed(3)}, bottomOffset: ${bottomOffset.toFixed(3)}`)
    
    return bottomOffset
  }

  private canModelSupportAnother(supportModel: BaseModel, targetModel: BaseModel, targetX: number, targetZ: number): boolean {
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

  public calculateSurfaceY(targetModel: BaseModel, x: number, z: number, excludeModelIds: string[] = []): number {
    const raycaster = new THREE.Raycaster()
    const rayOrigin = new THREE.Vector3(x, 10, z)
    const rayDirection = new THREE.Vector3(0, -1, 0)
    raycaster.set(rayOrigin, rayDirection)

    const colliders: THREE.Mesh[] = []
    this.models.forEach((model, modelId) => {
      if (modelId !== targetModel.getId() &&
          !excludeModelIds.includes(modelId) &&
          model.isModelLoaded() &&
          model.getType() !== 'wallcube' &&
          model.getModel()) {
        const modelColliders = model.getAllColliders()
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

    const floorMeshes = this.sceneIndex.getFloorMeshes()
    colliders.push(...floorMeshes)

    const intersections = raycaster.intersectObjects(colliders, false)
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
          if (surfaceModel && this.canModelSupportAnother(surfaceModel, targetModel, x, z)) {
            bestSurfaceY = Math.max(bestSurfaceY, surfaceY)
            
          } else {
            
          }
        }
      }
      if (bestSurfaceY > -Infinity) {
        const modelBottomOffset = this.getModelBottomOffset(targetModel)
        const finalY = bestSurfaceY - modelBottomOffset
        
        return finalY
      }
    }

    const floorY = this.getFloorHeight(x, z)
    const modelBottomOffset = this.getModelBottomOffset(targetModel)
    const finalY = floorY - modelBottomOffset
    
    return finalY
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

  public checkCollisionAndAdjust(targetModel: BaseModel, newX: number, newY: number, newZ: number): { x: number, y: number, z: number } {
    const targetModelGroup = targetModel.getModel()
    if (!targetModelGroup) {
      return { x: newX, y: Math.max(0, newY), z: newZ }
    }
    if (!this.hasFloorMeshes()) {
      
      const currentPosition = targetModel.getPosition()
      return { x: currentPosition.x, y: Math.max(0, currentPosition.y), z: currentPosition.z }
    }
    const clampedPosition = this.clampToBounds(targetModel, newX, newZ)
    let adjustedX = clampedPosition.x
    let adjustedZ = clampedPosition.z

    // XZ 겹침 시 주변 유효 위치로 이동
    if (this.hasCollisionWithExistingModels(targetModel, adjustedX, adjustedZ)) {
      const near = this.findNearestValidPositionNear(targetModel, adjustedX, adjustedZ)
      if (near) {
        adjustedX = near.x
        adjustedZ = near.z
      }
    }

    try {
      const surfaceY = this.calculateSurfaceY(targetModel, adjustedX, adjustedZ)
      const clampedSurfaceY = Math.max(0, surfaceY)
      return { x: adjustedX, y: clampedSurfaceY, z: adjustedZ }
    } catch {
      
      const currentPosition = targetModel.getPosition()
      return { x: currentPosition.x, y: Math.max(0, currentPosition.y), z: currentPosition.z }
    }
  }

  // 재배치 로직들
  public async recalculateOtherModelPositions(excludeModelId: string): Promise<void> {
    // 영향 가능성이 높은 모델만 선정: 수평거리/수직 레벨 근접한 모델만
    const dragged = this.models.get(excludeModelId)
    if (!dragged) return
    const dp = dragged.getPosition()
    const radius = 2.0 // 2m 반경 내 모델만 재계산
    const candidateIds: string[] = []
    this.models.forEach((m, id) => {
      if (id === excludeModelId || m.getType() === 'wallcube') return
      const p = m.getPosition()
      const dx = p.x - dp.x
      const dz = p.z - dp.z
      const dist = Math.sqrt(dx*dx + dz*dz)
      if (dist <= radius && Math.abs(p.y - dp.y) <= 1.0) {
        candidateIds.push(id)
      }
    })
    if (candidateIds.length > 0) {
      await this.recalculateAffectedModelPositions(candidateIds, dp)
    }
  }

  public findModelsAffectedByRemoval(removedModelId: string): string[] {
    const removedModel = this.models.get(removedModelId)
    if (!removedModel) return []
    const affectedModels: string[] = []
    const removedPosition = removedModel.getPosition()
    
    // 더 보수적인 영향 범위: 제거된 모델 주변 반경 1.5m 내의 모델만 고려
    const maxDistance = 1.5
    
    // 실제로 제거된 모델 위에 있는 모델들만 찾기
    this.models.forEach((model, modelId) => {
      if (modelId === removedModelId || model.getType() === 'wallcube') return
      const modelPosition = model.getPosition()
      
      // 거리 제한: 가까운 모델들만 고려
      const distance = Math.sqrt(
        Math.pow(modelPosition.x - removedPosition.x, 2) + 
        Math.pow(modelPosition.z - removedPosition.z, 2)
      )
      if (distance > maxDistance) return
      
      // 실제 지지 관계가 있는지 정확히 확인
      if (modelPosition.y > removedPosition.y + 0.05) {
        // 제거된 모델이 실제로 이 모델을 지지하고 있었는지 확인
        const isActuallySupported = this.canModelSupportAnother(removedModel, model, modelPosition.x, modelPosition.z)
        
        if (isActuallySupported) {
          // 추가 검증: 제거된 모델 아래에 다른 지지 모델이 있는지 확인
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
    
    // 타겟 모델 아래에 다른 지지 가능한 모델이 있는지 확인
    for (const [modelId, model] of this.models) {
      if (modelId === excludeModelId || modelId === targetModel.getId() || model.getType() === 'wallcube') {
        continue
      }
      
      const modelPosition = model.getPosition()
      
      // 타겟 모델보다 아래에 있고
      if (modelPosition.y < targetPosition.y - 0.05) {
        // 지지 관계가 성립하면
        if (this.canModelSupportAnother(model, targetModel, targetPosition.x, targetPosition.z)) {
          return true
        }
      }
    }
    
    // 바닥 지지 확인
    return this.canPlaceOnFloor(targetModel, targetPosition.x, targetPosition.z)
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
        // 1. 먼저 바닥에 배치 가능한지 확인
        const canPlaceOnFloor = this.canPlaceOnFloor(model, currentPosition.x, currentPosition.z)
        console.log(`[recalculateAffectedModelPositions] ${model.getType()} canPlaceOnFloor: ${canPlaceOnFloor}`)
        
        if (canPlaceOnFloor) {
          // 바닥에 직접 배치
          const floorY = this.calculateModelFloorY(model, currentPosition.x, currentPosition.z)
          console.log(`[recalculateAffectedModelPositions] ${model.getType()} placing on floor at Y: ${floorY.toFixed(3)}`)
          model.setPosition({ x: currentPosition.x, y: floorY, z: currentPosition.z })
        } else {
          // 2. 다른 모델 위에 배치 가능한지 확인
          const surfaceY = this.calculateSurfaceY(model, currentPosition.x, currentPosition.z, [id])
          const floorY = this.calculateModelFloorY(model, currentPosition.x, currentPosition.z)
          
          // 바닥보다 높은 표면이 있으면 그 위에, 없으면 바닥에
          const targetY = Math.max(surfaceY, floorY)
          console.log(`[recalculateAffectedModelPositions] ${model.getType()} placing at Y: ${targetY.toFixed(3)} (surfaceY: ${surfaceY.toFixed(3)}, floorY: ${floorY.toFixed(3)})`)
          model.setPosition({ x: currentPosition.x, y: targetY, z: currentPosition.z })
        }
        
        // Matrix 업데이트로 Three.js 상태 동기화
        const threeModel = model.getModel()
        if (threeModel) {
          threeModel.updateMatrixWorld(true)
        }
        
        // 위치 확정 후 검증
        const finalPosition = model.getPosition()
        const minFloorY = this.getFloorHeight(finalPosition.x, finalPosition.z)
        console.log(`[recalculateAffectedModelPositions] ${model.getType()} final position Y: ${finalPosition.y.toFixed(3)}, minFloorY: ${minFloorY.toFixed(3)}`)
        
        // 바닥 관통 시 강제로 바닥 위로 이동
        if (finalPosition.y < minFloorY) {
          console.log(`[recalculateAffectedModelPositions] ${model.getType()} PENETRATING FLOOR! Correcting...`)
          const correctedY = this.calculateModelFloorY(model, finalPosition.x, finalPosition.z)
          model.setPosition({ x: finalPosition.x, y: correctedY, z: finalPosition.z })
          
          if (threeModel) {
            threeModel.updateMatrixWorld(true)
          }
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

  public findOptimalPlacement(model: BaseModel): { x: number, y: number, z: number } | null {
    const floorBounds = this.getFloorBounds()
    if (!floorBounds) {
      if (process.env.NODE_ENV !== 'production') {
        
      }
      return null
    }
    const modelGroup = model.getModel()
    if (!modelGroup) {
      if (process.env.NODE_ENV !== 'production') {
        
      }
      return null
    }
    const originalPos = modelGroup.position.clone()
    const priorityPositions = this.generateSearchPositions(floorBounds)
    for (const testPos of priorityPositions) {
      modelGroup.position.set(testPos.x, 0, testPos.z)
      const modelBounds = new THREE.Box3().setFromObject(modelGroup)
      if (modelBounds.min.x < floorBounds.minX || modelBounds.max.x > floorBounds.maxX ||
          modelBounds.min.z < floorBounds.minZ || modelBounds.max.z > floorBounds.maxZ) {
        continue
      }
      if (!this.canPlaceOnFloor(model, testPos.x, testPos.z)) {
        continue
      }
      if (this.hasCollisionWithExistingModels(model, testPos.x, testPos.z)) {
        continue
      }
      try {
        const surfaceY = this.calculateSurfaceY(model, testPos.x, testPos.z)
        modelGroup.position.copy(originalPos)
        return { x: testPos.x, y: surfaceY, z: testPos.z }
      } catch (error) {
        if (process.env.NODE_ENV !== 'production') {
          
        }
        continue
      }
    }
    modelGroup.position.copy(originalPos)
    if (process.env.NODE_ENV !== 'production') {
      
    }
    return null
  }

  private generateSearchPositions(bounds: { minX: number, maxX: number, minZ: number, maxZ: number }): { x: number, z: number }[] {
    const positions: { x: number, z: number }[] = []
    const centerX = (bounds.minX + bounds.maxX) / 2
    const centerZ = (bounds.minZ + bounds.maxZ) / 2
    const gridSize = 0.5
    positions.push({ x: centerX, z: centerZ })
    let radius = gridSize
    const maxRadius = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ) / 2
    while (radius <= maxRadius) {
      const steps = Math.max(8, Math.floor(radius * 4))
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

  private hasCollisionWithExistingModels(testModel: BaseModel, x: number, z: number): boolean {
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

  private generateSearchPositionsAround(centerX: number, centerZ: number, bounds: { minX: number, maxX: number, minZ: number, maxZ: number }, gridSize: number = 0.5): { x: number, z: number }[] {
    const positions: { x: number, z: number }[] = []
    positions.push({ x: centerX, z: centerZ })
    let radius = gridSize
    const maxRadius = Math.max(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ)
    while (radius <= maxRadius) {
      const steps = Math.max(8, Math.floor(radius * 6))
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

  private findNearestValidPositionNear(model: BaseModel, startX: number, startZ: number): { x: number, z: number } | null {
    const bounds = this.getFloorBounds()
    if (!bounds) return null
    const candidates = this.generateSearchPositionsAround(startX, startZ, bounds)
    for (const pos of candidates) {
      if (!this.canPlaceOnFloor(model, pos.x, pos.z)) continue
      if (this.hasCollisionWithExistingModels(model, pos.x, pos.z)) continue
      return pos
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


