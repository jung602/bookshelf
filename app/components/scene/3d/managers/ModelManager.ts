import * as THREE from 'three'
import { BaseModel } from '../objects/BaseModel'

export interface FloorBounds {
  width: number
  height: number
  minX: number
  maxX: number
  minZ: number
  maxZ: number
  floorY: number
}

export class ModelManager {
  private models: Map<string, BaseModel> = new Map()
  private scene: THREE.Scene
  private floorBounds!: FloorBounds

  constructor(scene: THREE.Scene, floorWidth: number = 5, floorHeight: number = 5) {
    this.scene = scene
    this.updateFloorBounds(floorWidth, floorHeight)
  }

  public updateFloorBounds(width: number, height: number): void {
    this.floorBounds = {
      width,
      height,
      minX: -width / 2,
      maxX: width / 2,
      minZ: -height / 2,
      maxZ: height / 2,
      floorY: 0 // 바닥의 Y 위치
    }

    // 기존 모델들의 위치를 새로운 바닥 경계에 맞게 조정
    this.adjustModelsToFloorBounds()
  }

  public async addModel(model: BaseModel): Promise<void> {
    try {
      await model.load()
      
      // 모델을 바닥 위에 올바르게 배치
      this.positionModelOnFloor(model)
      
      model.addToScene(this.scene)
      this.models.set(model.getId(), model)
      
      console.log(`Model ${model.getId()} added to scene`)
    } catch (error) {
      console.error('Failed to add model:', error)
      throw error
    }
  }

  public removeModel(modelId: string): void {
    const model = this.models.get(modelId)
    if (model) {
      console.log(`Starting removal of model ${modelId}`)
      console.log(`Current models before removal:`, Array.from(this.models.keys()))
      
      model.removeFromScene(this.scene)
      model.dispose()
      this.models.delete(modelId)
      
      console.log(`Model ${modelId} removed, remaining models:`, Array.from(this.models.keys()))
      
      // 모델 제거 후 나머지 모든 모델들의 위치 재계산
      this.recalculateAllModelPositions()
      
      console.log(`Model ${modelId} removed from scene and all model positions recalculated`)
    } else {
      console.log(`Model ${modelId} not found for removal`)
    }
  }

  public getModel(modelId: string): BaseModel | undefined {
    return this.models.get(modelId)
  }

  public getAllModels(): BaseModel[] {
    return Array.from(this.models.values())
  }

  public moveModel(modelId: string, x: number, z: number): void {
    const model = this.models.get(modelId)
    if (!model) return

    // 모델의 바운딩 박스를 고려한 경계 체크
    const clampedPosition = this.clampToFloorWithBounds(model, x, z)

    // Y 위치 계산 - 다른 모델 위에 올라갈 수 있도록 표면 감지
    const modelY = this.calculateSurfaceY(model, clampedPosition.x, clampedPosition.z)
    model.setPosition({
      x: clampedPosition.x,
      y: modelY,
      z: clampedPosition.z
    })

    console.log(`Model ${modelId} moved to (${clampedPosition.x}, ${modelY}, ${clampedPosition.z})`)
  }

  public rotateModel(modelId: string): void {
    const model = this.models.get(modelId)
    if (!model) return

    model.rotateY90()
    console.log(`Model ${modelId} rotated 90 degrees`)
  }

  private calculateModelFloorY(model: BaseModel): number {
    const threeModel = model.getModel()
    if (!threeModel) return this.floorBounds.floorY

    // 현재 위치에서 바운딩 박스 계산
    const box = new THREE.Box3().setFromObject(threeModel)
    
    // 모델의 하단이 바닥에 닿도록 Y 위치 계산
    const modelBottomOffset = box.min.y - threeModel.position.y
    const floorY = this.floorBounds.floorY - modelBottomOffset
    
    // 부동소수점 정밀도 문제 해결을 위해 반올림
    const roundedY = Math.round(floorY * 10000) / 10000
    
    return roundedY
  }

  private positionModelOnFloor(model: BaseModel): void {
    const position = model.getPosition()
    
    // 모델의 바운딩 박스를 고려한 경계 체크
    const clampedPosition = this.clampToFloorWithBounds(model, position.x, position.z)
    
    // Y 좌표는 표면 감지를 통해 계산 (다른 모델 위에도 올라갈 수 있음)
    const modelY = this.calculateSurfaceY(model, clampedPosition.x, clampedPosition.z)
    
    model.setPosition({
      x: clampedPosition.x,
      y: modelY,
      z: clampedPosition.z
    })

    console.log(`Model positioned on surface at (${clampedPosition.x}, ${modelY}, ${clampedPosition.z})`)
  }

  // 모델의 바운딩 박스를 고려한 경계 체크
  public clampToFloorWithBounds(model: BaseModel, x: number, z: number): { x: number, z: number } {
    const threeModel = model.getModel()
    if (!threeModel) {
      return this.clampToFloor(x, z)
    }

    // 임시로 모델을 목표 위치에 배치해서 바운딩 박스 계산
    const originalPosition = threeModel.position.clone()
    threeModel.position.set(x, 0, z)
    
    const box = new THREE.Box3().setFromObject(threeModel)
    
    // 원래 위치로 복원
    threeModel.position.copy(originalPosition)
    
    // 모델의 경계가 바닥 경계를 넘지 않도록 조정
    const modelMinX = box.min.x
    const modelMaxX = box.max.x
    const modelMinZ = box.min.z
    const modelMaxZ = box.max.z
    
    // X축 경계 체크 (모델의 가장자리가 벽을 넘지 않도록)
    let clampedX = x
    if (modelMinX < this.floorBounds.minX) {
      clampedX = x + (this.floorBounds.minX - modelMinX)
    } else if (modelMaxX > this.floorBounds.maxX) {
      clampedX = x - (modelMaxX - this.floorBounds.maxX)
    }
    
    // Z축 경계 체크 (모델의 가장자리가 벽을 넘지 않도록)
    let clampedZ = z
    if (modelMinZ < this.floorBounds.minZ) {
      clampedZ = z + (this.floorBounds.minZ - modelMinZ)
    } else if (modelMaxZ > this.floorBounds.maxZ) {
      clampedZ = z - (modelMaxZ - this.floorBounds.maxZ)
    }
    
    return { x: clampedX, z: clampedZ }
  }

  private adjustModelsToFloorBounds(): void {
    this.models.forEach((model) => {
      this.positionModelOnFloor(model)
    })
  }

  public update(): void {
    this.models.forEach((model) => {
      model.update()
    })
  }

  public getFloorBounds(): FloorBounds {
    return { ...this.floorBounds }
  }

  public isPositionValid(x: number, z: number): boolean {
    return (
      x >= this.floorBounds.minX &&
      x <= this.floorBounds.maxX &&
      z >= this.floorBounds.minZ &&
      z <= this.floorBounds.maxZ
    )
  }

  // 3D 공간의 좌표를 바닥 위의 유효한 위치로 변환
  public clampToFloor(x: number, z: number): { x: number, z: number } {
    return {
      x: Math.max(this.floorBounds.minX, Math.min(this.floorBounds.maxX, x)),
      z: Math.max(this.floorBounds.minZ, Math.min(this.floorBounds.maxZ, z))
    }
  }

  public dispose(): void {
    this.models.forEach((model) => {
      model.removeFromScene(this.scene)
      model.dispose()
    })
    this.models.clear()
  }

  // 지정된 위치에서 가장 높은 표면의 Y 좌표를 찾는 메서드
  public calculateSurfaceY(targetModel: BaseModel, x: number, z: number): number {
    const raycaster = new THREE.Raycaster()
    
    // 위에서 아래로 레이캐스팅 (충분히 높은 위치에서 시작)
    const rayOrigin = new THREE.Vector3(x, 10, z)
    const rayDirection = new THREE.Vector3(0, -1, 0)
    raycaster.set(rayOrigin, rayDirection)

    console.log(`    📍 Calculating surface Y for ${targetModel.getId()} at (${x.toFixed(3)}, ${z.toFixed(3)})`)

    // 다른 모든 모든 모델의 콜라이더 수집 (자기 자신 제외)
    const colliders: THREE.Mesh[] = []
    const otherModels: BaseModel[] = []
    this.models.forEach((model) => {
      if (model.getId() !== targetModel.getId() && model.isModelLoaded()) {
        const modelColliders = model.getAllColliders()
        colliders.push(...modelColliders)
        otherModels.push(model)
        console.log(`      -> Added ${modelColliders.length} colliders from model ${model.getId()}`)
      }
    })

    // 바닥도 포함 (바닥 메시 찾기)
    const floorMeshes: THREE.Mesh[] = []
    this.scene.traverse((child) => {
      if (child.userData.isFloor && child instanceof THREE.Mesh) {
        floorMeshes.push(child)
      }
    })
    colliders.push(...floorMeshes)
    console.log(`      -> Added ${floorMeshes.length} floor meshes`)
    console.log(`      -> Total colliders for raycast: ${colliders.length}`)

    // 레이캐스팅 실행
    const intersections = raycaster.intersectObjects(colliders, false)
    console.log(`      -> Raycast found ${intersections.length} intersections`)
    
    if (intersections.length > 0) {
      // 모든 교차점을 검사하여 실제로 지지할 수 있는 표면 찾기
      let validSurfaceY = null
      
      for (const intersection of intersections) {
        const surfaceY = intersection.point.y
        
        // 바닥 메시인지 확인
        const isFloorMesh = intersection.object.userData.isFloor
        
        if (isFloorMesh) {
          // 바닥이면 항상 유효한 표면
          if (validSurfaceY === null || surfaceY > validSurfaceY) {
            validSurfaceY = surfaceY
            console.log(`      -> Found floor surface at Y: ${surfaceY.toFixed(3)}`)
          }
        } else {
          // 다른 모델의 표면인 경우, 실제로 그 위에 올라갈 수 있는지 확인
          const surfaceModelId = intersection.object.userData.modelId
          const surfaceModel = this.models.get(surfaceModelId)
          
          if (surfaceModel && this.canModelSupportAnother(surfaceModel, targetModel, x, z)) {
            if (validSurfaceY === null || surfaceY > validSurfaceY) {
              validSurfaceY = surfaceY
              console.log(`      -> Found valid model surface at Y: ${surfaceY.toFixed(3)} from model ${surfaceModelId}`)
            }
          } else {
            console.log(`      -> Rejected surface at Y: ${surfaceY.toFixed(3)} from model ${surfaceModelId} (not supportable)`)
          }
        }
      }
      
      if (validSurfaceY !== null) {
        // 타겟 모델의 바운딩 박스를 고려하여 Y 위치 계산
        const modelBottomOffset = this.getModelBottomOffset(targetModel)
        
        // 표면 Y 위치에서 모델의 바닥 오프셋을 빼서 모델의 중심 위치 계산
        // bottomOffset이 음수이므로 빼기를 하면 실제로는 더해짐
        const finalY = validSurfaceY - modelBottomOffset
        
        // 부동소수점 정밀도 문제 해결을 위해 소수점 4자리에서 반올림
        const roundedY = Math.round(finalY * 10000) / 10000
        
        console.log(`      -> Valid surface found at Y: ${validSurfaceY.toFixed(3)}, model bottom offset: ${modelBottomOffset.toFixed(3)}, final Y: ${finalY.toFixed(3)}, rounded Y: ${roundedY.toFixed(3)}`)
        return roundedY
      }
    }

    // 교차점이 없거나 유효한 표면이 없으면 기본 바닥 위치 사용
    const fallbackY = this.calculateModelFloorY(targetModel)
    console.log(`      -> No valid intersections found, using fallback floor Y: ${fallbackY.toFixed(3)}`)
    return fallbackY
  }

  // 한 모델이 다른 모델을 지지할 수 있는지 확인하는 메서드
  private canModelSupportAnother(supportModel: BaseModel, targetModel: BaseModel, targetX: number, targetZ: number): boolean {
    const supportModelGroup = supportModel.getModel()
    const targetModelGroup = targetModel.getModel()
    
    if (!supportModelGroup || !targetModelGroup) return false

    // 지지하는 모델의 바운딩 박스 계산
    const supportBox = new THREE.Box3().setFromObject(supportModelGroup)
    
    // 타겟 모델을 임시로 목표 위치에 배치하여 바운딩 박스 계산
    const originalTargetPosition = targetModelGroup.position.clone()
    targetModelGroup.position.set(targetX, 0, targetZ)
    const targetBox = new THREE.Box3().setFromObject(targetModelGroup)
    targetModelGroup.position.copy(originalTargetPosition)
    
    // X, Z 축에서 충분한 겹침이 있는지 확인 (최소 50% 겹침)
    const xOverlap = Math.min(targetBox.max.x, supportBox.max.x) - Math.max(targetBox.min.x, supportBox.min.x)
    const zOverlap = Math.min(targetBox.max.z, supportBox.max.z) - Math.max(targetBox.min.z, supportBox.min.z)
    
    const targetWidth = targetBox.max.x - targetBox.min.x
    const targetDepth = targetBox.max.z - targetBox.min.z
    
    const xOverlapRatio = xOverlap / targetWidth
    const zOverlapRatio = zOverlap / targetDepth
    
    // 최소 50% 이상 겹쳐야 지지할 수 있음
    const canSupport = xOverlapRatio >= 0.5 && zOverlapRatio >= 0.5 && xOverlap > 0 && zOverlap > 0
    
    console.log(`      -> Support check: ${supportModel.getId()} -> ${targetModel.getId()}: xOverlap=${xOverlapRatio.toFixed(2)}, zOverlap=${zOverlapRatio.toFixed(2)}, canSupport=${canSupport}`)
    
    return canSupport
  }

  // 모델의 하단 오프셋 계산 (모델의 바운딩 박스 하단)
  private getModelBottomOffset(model: BaseModel): number {
    const threeModel = model.getModel()
    if (!threeModel) return 0

    // 현재 위치에서 바운딩 박스 계산 (위치 변경 없이)
    const box = new THREE.Box3().setFromObject(threeModel)
    
    // 모델의 하단 오프셋 반환 (항상 음수이거나 0)
    const bottomOffset = box.min.y - threeModel.position.y
    
    console.log(`      -> Model ${model.getId()} bottom offset: ${bottomOffset.toFixed(3)} (box.min.y: ${box.min.y.toFixed(3)}, model.position.y: ${threeModel.position.y.toFixed(3)})`)
    return bottomOffset
  }

  // 충돌 감지 및 자동 올라가기 기능
  public checkCollisionAndAdjust(targetModel: BaseModel, newX: number, newY: number, newZ: number): { x: number, y: number, z: number } {
    const targetModelGroup = targetModel.getModel()
    if (!targetModelGroup) {
      return { x: newX, y: newY, z: newZ }
    }

    // 먼저 경계 체크를 통해 X, Z 좌표를 벽 안쪽으로 제한
    const clampedPosition = this.clampToFloorWithBounds(targetModel, newX, newZ)
    const adjustedX = clampedPosition.x
    const adjustedZ = clampedPosition.z

    // 임시로 모델을 경계가 적용된 새 위치에 배치하여 바운딩 박스 계산
    const originalPosition = targetModelGroup.position.clone()
    targetModelGroup.position.set(adjustedX, newY, adjustedZ)
    const targetBoundingBox = new THREE.Box3().setFromObject(targetModelGroup)
    
    // 원래 위치로 복원
    targetModelGroup.position.copy(originalPosition)

    // 다른 모든 모든 모델과 충돌 검사
    let highestSurfaceY = newY
    let foundCollision = false

    this.models.forEach((otherModel) => {
      if (otherModel.getId() !== targetModel.getId() && otherModel.isModelLoaded()) {
        const otherModelGroup = otherModel.getModel()
        if (!otherModelGroup) return

        const otherBoundingBox = new THREE.Box3().setFromObject(otherModelGroup)
        
        // X, Z 축에서 겹치는지 확인 (Y축은 제외)
        const xOverlap = targetBoundingBox.max.x > otherBoundingBox.min.x && 
                        targetBoundingBox.min.x < otherBoundingBox.max.x
        const zOverlap = targetBoundingBox.max.z > otherBoundingBox.min.z && 
                        targetBoundingBox.min.z < otherBoundingBox.max.z

        if (xOverlap && zOverlap) {
          // X, Z에서 겹침이 있음 - 충돌 가능성
          const otherTopY = otherBoundingBox.max.y
          const targetBottomY = targetBoundingBox.min.y

          // 타겟 모델이 다른 모델과 Y축에서도 겹치는지 확인
          if (targetBottomY < otherTopY && targetBoundingBox.max.y > otherBoundingBox.min.y) {
            // 충돌 발생! 다른 모델 위로 올라가야 함
            foundCollision = true
            const modelBottomOffset = this.getModelBottomOffset(targetModel)
            const adjustedY = otherTopY - modelBottomOffset
            
            if (adjustedY > highestSurfaceY) {
              highestSurfaceY = adjustedY
            }
            
            console.log(`Collision detected! Moving model above surface at Y: ${adjustedY}`)
          }
        }
      }
    })

    // 바닥과의 충돌도 확인
    if (!foundCollision) {
      const floorY = this.calculateSurfaceY(targetModel, adjustedX, adjustedZ)
      if (newY < floorY) {
        highestSurfaceY = floorY
        foundCollision = true
      }
    }

    return {
      x: adjustedX,  // 경계가 적용된 X 좌표
      y: highestSurfaceY,
      z: adjustedZ   // 경계가 적용된 Z 좌표
    }
  }

  // 올라갈 수 있는 표면인지 확인하는 헬퍼 메서드
  private isClimbableSurface(targetModel: BaseModel, surfaceModel: BaseModel): boolean {
    const targetModelGroup = targetModel.getModel()
    const surfaceModelGroup = surfaceModel.getModel()
    
    if (!targetModelGroup || !surfaceModelGroup) return false

    // 임시로 타겟 모델을 원점에 배치하여 크기 계산
    const originalTargetPosition = targetModelGroup.position.clone()
    targetModelGroup.position.set(0, 0, 0)
    const targetBox = new THREE.Box3().setFromObject(targetModelGroup)
    targetModelGroup.position.copy(originalTargetPosition)

    // 표면 모델의 바운딩 박스 계산
    const surfaceBox = new THREE.Box3().setFromObject(surfaceModelGroup)
    
    // 타겟 모델의 크기
    const targetWidth = targetBox.max.x - targetBox.min.x
    const targetDepth = targetBox.max.z - targetBox.min.z
    
    // 표면의 크기
    const surfaceWidth = surfaceBox.max.x - surfaceBox.min.x
    const surfaceDepth = surfaceBox.max.z - surfaceBox.min.z
    
    // 표면이 타겟 모델보다 충분히 큰지 확인 (최소 80% 이상)
    const minRequiredWidth = targetWidth * 0.8
    const minRequiredDepth = targetDepth * 0.8
    
    return surfaceWidth >= minRequiredWidth && surfaceDepth >= minRequiredDepth
  }

  // 모든 모델의 위치를 재계산하는 메서드
  private recalculateAllModelPositions(): void {
    console.log('=== Starting position recalculation for all models ===')
    console.log(`Total models to check: ${this.models.size}`)
    
    let hasChanges = true
    let iterations = 0
    const maxIterations = 5 // 무한 루프 방지
    
    // 연쇄적으로 떨어질 수 있는 모델들을 고려하여 여러 번 재계산
    while (hasChanges && iterations < maxIterations) {
      hasChanges = false
      iterations++
      
      console.log(`=== Position recalculation iteration ${iterations} ===`)
      
      // 모든 모델에 대해 현재 X, Z 위치에서 올바른 Y 위치를 재계산
      this.models.forEach((model) => {
        if (model.isModelLoaded()) {
          const currentPosition = model.getPosition()
          console.log(`Checking model ${model.getId()} at position (${currentPosition.x.toFixed(3)}, ${currentPosition.y.toFixed(3)}, ${currentPosition.z.toFixed(3)})`)
          
          // 현재 X, Z 위치에서 올바른 표면 Y 위치 계산
          const newY = this.calculateSurfaceY(model, currentPosition.x, currentPosition.z)
          console.log(`  -> Calculated surface Y: ${newY.toFixed(3)}`)
          
          // Y 위치가 변경되었을 때만 업데이트
          if (Math.abs(currentPosition.y - newY) > 0.001) {
            model.setPosition({
              x: currentPosition.x,
              y: newY,
              z: currentPosition.z
            })
            
            hasChanges = true // 변경이 있었음을 표시
            console.log(`  -> ✅ Model ${model.getId()} repositioned from Y:${currentPosition.y.toFixed(3)} to Y:${newY.toFixed(3)}`)
          } else {
            console.log(`  -> ⏸️ Model ${model.getId()} position unchanged (difference: ${Math.abs(currentPosition.y - newY).toFixed(3)})`)
          }
        } else {
          console.log(`Model ${model.getId()} is not loaded, skipping`)
        }
      })
    }
    
    console.log(`=== Position recalculation completed after ${iterations} iterations ===`)
  }

  // 특정 모델을 제외한 다른 모든 모델들의 위치를 재계산하는 메서드
  public recalculateOtherModelPositions(excludeModelId: string): void {
    console.log(`=== Starting position recalculation for models (excluding ${excludeModelId}) ===`)
    
    // 제외된 모델을 제외한 모든 모델 수집
    const modelsToRecalculate: BaseModel[] = []
    this.models.forEach((model) => {
      if (model.getId() !== excludeModelId && model.isModelLoaded()) {
        modelsToRecalculate.push(model)
      }
    })
    
    console.log(`Total models to check: ${modelsToRecalculate.length}`)
    
    if (modelsToRecalculate.length === 0) {
      console.log('No models to recalculate')
      return
    }
    
    // 모델들을 Y 좌표가 낮은 순서대로 정렬 (아래에서부터 위로)
    modelsToRecalculate.sort((a, b) => {
      const aY = a.getPosition().y
      const bY = b.getPosition().y
      return aY - bY
    })
    
    console.log('Models sorted by Y position (lowest first):')
    modelsToRecalculate.forEach((model, index) => {
      const pos = model.getPosition()
      console.log(`  ${index + 1}. ${model.getId()} at Y: ${pos.y.toFixed(3)}`)
    })
    
    let hasChanges = true
    let iterations = 0
    const maxIterations = 3 // 무한 루프 방지 (줄임)
    
    // 연쇄적으로 떨어질 수 있는 모델들을 고려하여 여러 번 재계산
    while (hasChanges && iterations < maxIterations) {
      hasChanges = false
      iterations++
      
      console.log(`=== Position recalculation iteration ${iterations} (excluding ${excludeModelId}) ===`)
      
      // Y 좌표가 낮은 순서대로 재계산 (가장 아래에 있는 것부터)
      for (let i = 0; i < modelsToRecalculate.length; i++) {
        const model = modelsToRecalculate[i]
        const currentPosition = model.getPosition()
        console.log(`Checking model ${model.getId()} (${i + 1}/${modelsToRecalculate.length}) at position (${currentPosition.x.toFixed(3)}, ${currentPosition.y.toFixed(3)}, ${currentPosition.z.toFixed(3)})`)
        
        // 가장 아래에 있는 모델이면서 바닥에 닿아있지 않다면 강제로 바닥에 붙임
        if (i === 0) {
          const floorY = this.calculateModelFloorY(model)
          const isOnFloor = Math.abs(currentPosition.y - floorY) < 0.01
          
          if (!isOnFloor) {
            console.log(`  -> 🔧 Forcing lowest model ${model.getId()} to floor Y: ${floorY.toFixed(3)}`)
            model.setPosition({
              x: currentPosition.x,
              y: floorY,
              z: currentPosition.z
            })
            hasChanges = true
            continue
          }
        }
        
        // 현재 X, Z 위치에서 올바른 표면 Y 위치 계산
        const newY = this.calculateSurfaceY(model, currentPosition.x, currentPosition.z)
        console.log(`  -> Calculated surface Y: ${newY.toFixed(3)}`)
        
        // Y 위치가 변경되었을 때만 업데이트
        if (Math.abs(currentPosition.y - newY) > 0.001) {
          // 새로운 Y 위치가 현재보다 아래에 있을 때만 이동 (떨어지기만 허용)
          if (newY <= currentPosition.y + 0.001) {
            model.setPosition({
              x: currentPosition.x,
              y: newY,
              z: currentPosition.z
            })
            
            hasChanges = true // 변경이 있었음을 표시
            console.log(`  -> ✅ Model ${model.getId()} repositioned from Y:${currentPosition.y.toFixed(3)} to Y:${newY.toFixed(3)}`)
            
            // 위치가 변경된 모델을 다시 정렬에 반영하기 위해 배열 재정렬
            modelsToRecalculate.sort((a, b) => {
              const aY = a.getPosition().y
              const bY = b.getPosition().y
              return aY - bY
            })
          } else {
            console.log(`  -> ⚠️ Model ${model.getId()} would move up (from ${currentPosition.y.toFixed(3)} to ${newY.toFixed(3)}), preventing upward movement`)
          }
        } else {
          console.log(`  -> ⏸️ Model ${model.getId()} position unchanged (difference: ${Math.abs(currentPosition.y - newY).toFixed(3)})`)
        }
      }
    }
    
    console.log(`=== Position recalculation completed after ${iterations} iterations (excluding ${excludeModelId}) ===`)
  }
} 