import * as THREE from 'three'
import { BaseModel } from '../objects/BaseModel'

export class ModelManager {
  private models: Map<string, BaseModel> = new Map()
  private scene: THREE.Scene

  constructor(scene: THREE.Scene) {
    this.scene = scene
  }

  // 실제 바닥 메시가 있는지 확인하는 메서드
  private hasFloorMeshes(): boolean {
    const floorMeshes: THREE.Mesh[] = []
    this.scene.traverse((child) => {
      if (child.userData.isFloor && child instanceof THREE.Mesh) {
        floorMeshes.push(child)
      }
    })
    return floorMeshes.length > 0
  }

  // 실제 바닥 메시들의 경계 계산
  private calculateFloorBounds(): { minX: number, maxX: number, minZ: number, maxZ: number, floorY: number } | null {
    const floorMeshes: THREE.Mesh[] = []
    this.scene.traverse((child) => {
      if (child.userData.isFloor && child instanceof THREE.Mesh) {
        floorMeshes.push(child)
      }
    })

    if (floorMeshes.length === 0) {
      return null
    }

    let minX = Infinity, maxX = -Infinity
    let minZ = Infinity, maxZ = -Infinity
    let floorY = 0

    floorMeshes.forEach(mesh => {
      const box = new THREE.Box3().setFromObject(mesh)
      minX = Math.min(minX, box.min.x)
      maxX = Math.max(maxX, box.max.x)
      minZ = Math.min(minZ, box.min.z)
      maxZ = Math.max(maxZ, box.max.z)
      floorY = Math.max(floorY, box.max.y) // 가장 높은 바닥 표면
    })

    return { minX, maxX, minZ, maxZ, floorY }
  }

  // 특정 위치에 실제 바닥 타일이 있는지 확인
  private hasFloorTileAt(x: number, z: number): boolean {
    const raycaster = new THREE.Raycaster()
    
    // 위에서 아래로 레이캐스팅
    const rayOrigin = new THREE.Vector3(x, 1, z)
    const rayDirection = new THREE.Vector3(0, -1, 0)
    raycaster.set(rayOrigin, rayDirection)

    // 바닥 메시들만 대상으로 레이캐스팅
    const floorMeshes: THREE.Mesh[] = []
    this.scene.traverse((child) => {
      if (child.userData.isFloor && child instanceof THREE.Mesh) {
        floorMeshes.push(child)
      }
    })

    const intersections = raycaster.intersectObjects(floorMeshes, false)
    return intersections.length > 0
  }

  // 가장 가까운 유효한 바닥 타일 위치 찾기
  private findNearestFloorTile(x: number, z: number): { x: number, z: number } | null {
    const floorMeshes: THREE.Mesh[] = []
    this.scene.traverse((child) => {
      if (child.userData.isFloor && child instanceof THREE.Mesh) {
        floorMeshes.push(child)
      }
    })

    if (floorMeshes.length === 0) {
      return null
    }

    let nearestTile = null
    let minDistance = Infinity

    floorMeshes.forEach(mesh => {
      const meshPosition = mesh.position
      const distance = Math.sqrt(
        Math.pow(x - meshPosition.x, 2) + Math.pow(z - meshPosition.z, 2)
      )
      
      if (distance < minDistance) {
        minDistance = distance
        nearestTile = { x: meshPosition.x, z: meshPosition.z }
      }
    })

    return nearestTile
  }

  public async addModel(model: BaseModel): Promise<void> {
    // 바닥이 없으면 모델 추가 거부
    if (!this.hasFloorMeshes()) {
      throw new Error('바닥을 먼저 생성해주세요. 모델은 바닥이 있어야만 배치할 수 있습니다.')
    }

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

    // 실제 바닥이 있는지 확인
    if (!this.hasFloorMeshes()) {
      console.log('No floor available - cannot move model')
      return
    }

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

  // 모델의 바운딩 박스를 고려한 경계 체크 (실제 바닥 기반)
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
    
    // 모델의 4개 모서리 점이 모두 유효한 바닥 타일 위에 있는지 확인
    const corners = [
      { x: box.min.x, z: box.min.z }, // 좌하단
      { x: box.max.x, z: box.min.z }, // 우하단
      { x: box.min.x, z: box.max.z }, // 좌상단
      { x: box.max.x, z: box.max.z }  // 우상단
    ]
    
    // 모든 모서리가 유효한 바닥 위에 있는지 확인
    const allCornersValid = corners.every(corner => this.hasFloorTileAt(corner.x, corner.z))
    
    if (allCornersValid) {
      return { x, z } // 모든 모서리가 유효하면 원래 위치 유지
    }

    // 일부 모서리가 유효하지 않으면 가장 가까운 유효한 위치로 이동
    const centerX = (box.min.x + box.max.x) / 2
    const centerZ = (box.min.z + box.max.z) / 2
    const modelWidth = box.max.x - box.min.x
    const modelDepth = box.max.z - box.min.z
    
    // 가장 가까운 유효한 타일 찾기
    const nearestTile = this.findNearestFloorTile(centerX, centerZ)
    if (!nearestTile) {
      return { x, z } // 유효한 타일이 없으면 원래 위치 유지
    }

    // 모델의 중심이 해당 타일에 오도록 조정
    let adjustedX = nearestTile.x
    let adjustedZ = nearestTile.z

    // 조정된 위치에서 모델의 모든 모서리가 유효한지 다시 확인
    threeModel.position.set(adjustedX, 0, adjustedZ)
    const adjustedBox = new THREE.Box3().setFromObject(threeModel)
    threeModel.position.copy(originalPosition)

    const adjustedCorners = [
      { x: adjustedBox.min.x, z: adjustedBox.min.z },
      { x: adjustedBox.max.x, z: adjustedBox.min.z },
      { x: adjustedBox.min.x, z: adjustedBox.max.z },
      { x: adjustedBox.max.x, z: adjustedBox.max.z }
    ]

    // 조정된 위치에서도 모든 모서리가 유효하지 않으면 추가 조정
    if (!adjustedCorners.every(corner => this.hasFloorTileAt(corner.x, corner.z))) {
      // 모델이 너무 크거나 복잡한 경우, 단순히 중심점만 유효한 타일 위에 놓기
      return { x: nearestTile.x, z: nearestTile.z }
    }

    return { x: adjustedX, z: adjustedZ }
  }

  public update(): void {
    this.models.forEach((model) => {
      model.update()
    })
  }

  public isPositionValid(x: number, z: number): boolean {
    // 실제 바닥 타일이 있는 위치인지 확인
    return this.hasFloorTileAt(x, z)
  }

  // 3D 공간의 좌표를 바닥 위의 유효한 위치로 변환 (실제 바닥 기반)
  public clampToFloor(x: number, z: number): { x: number, z: number } {
    // 실제 타일이 있는 위치인지 확인
    if (this.hasFloorTileAt(x, z)) {
      return { x, z }
    }

    // 가장 가까운 유효한 타일 위치 찾기
    const nearestTile = this.findNearestFloorTile(x, z)
    if (nearestTile) {
      return { x: nearestTile.x, z: nearestTile.z }
    }

    // 바닥이 없으면 원래 위치 유지
    return { x, z }
  }

  public dispose(): void {
    this.models.forEach((model) => {
      model.removeFromScene(this.scene)
      model.dispose()
    })
    this.models.clear()
  }

  private calculateModelFloorY(model: BaseModel): number {
    const threeModel = model.getModel()
    if (!threeModel) return 0

    // 현재 위치에서 바운딩 박스 계산
    const box = new THREE.Box3().setFromObject(threeModel)
    
    // 모델의 하단이 바닥에 닿도록 Y 위치 계산
    const modelBottomOffset = box.min.y - threeModel.position.y
    const floorY = 0 - modelBottomOffset
    
    // 부동소수점 정밀도 문제 해결을 위해 반올림
    const roundedY = Math.round(floorY * 10000) / 10000
    
    return roundedY
  }

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

    // 교차점이 없거나 유효한 표면이 없으면 null 반환 (바닥이 없음을 의미)
    console.log(`      -> No valid surface found, cannot place model without floor`)
    throw new Error('유효한 표면을 찾을 수 없습니다. 모델을 배치할 바닥이 필요합니다.')
  }

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
          try {
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
          } catch (error) {
            console.log(`  -> ⚠️ Cannot calculate surface Y for model ${model.getId()}: No floor available`)
            // 바닥이 없으면 현재 위치 유지
          }
        } else {
          console.log(`Model ${model.getId()} is not loaded, skipping`)
        }
      })
    }
    
    console.log(`=== Position recalculation completed after ${iterations} iterations ===`)
  }

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
          try {
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
          } catch (error) {
            console.log(`  -> ⚠️ Cannot calculate floor Y for model ${model.getId()}: No floor available`)
            // 바닥이 없으면 계속 진행
          }
        }
        
        // 현재 X, Z 위치에서 올바른 표면 Y 위치 계산
        try {
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
        } catch (error) {
          console.log(`  -> ⚠️ Cannot calculate surface Y for model ${model.getId()}: No floor available`)
          // 바닥이 없으면 현재 위치 유지
        }
      }
    }
    
    console.log(`=== Position recalculation completed after ${iterations} iterations (excluding ${excludeModelId}) ===`)
  }

  // 충돌 감지 및 자동 올라가기 기능 (InteractionManager에서 사용)
  public checkCollisionAndAdjust(targetModel: BaseModel, newX: number, newY: number, newZ: number): { x: number, y: number, z: number } {
    const targetModelGroup = targetModel.getModel()
    if (!targetModelGroup) {
      return { x: newX, y: Math.max(0, newY), z: newZ }
    }

    // 바닥이 없으면 원래 위치 유지 (단, Y 좌표는 0 이상으로 제한)
    if (!this.hasFloorMeshes()) {
      console.log('No floor available - keeping original position')
      const currentPosition = targetModel.getPosition()
      return { 
        x: currentPosition.x, 
        y: Math.max(0, currentPosition.y), 
        z: currentPosition.z 
      }
    }

    // 먼저 경계 체크를 통해 X, Z 좌표를 바닥 안쪽으로 제한
    const clampedPosition = this.clampToFloorWithBounds(targetModel, newX, newZ)
    const adjustedX = clampedPosition.x
    const adjustedZ = clampedPosition.z

    // 현재 위치에서 올바른 표면 Y 위치 계산
    try {
      const surfaceY = this.calculateSurfaceY(targetModel, adjustedX, adjustedZ)
      // Y 좌표가 바닥 위치(y=0) 아래로 가지 않도록 제한
      const clampedSurfaceY = Math.max(0, surfaceY)
      return {
        x: adjustedX,
        y: clampedSurfaceY,
        z: adjustedZ
      }
    } catch (error) {
      // 유효한 표면을 찾을 수 없으면 원래 위치 유지 (단, Y 좌표는 0 이상으로 제한)
      console.log('Cannot find valid surface - keeping original position')
      const currentPosition = targetModel.getPosition()
      return { 
        x: currentPosition.x, 
        y: Math.max(0, currentPosition.y), 
        z: currentPosition.z 
      }
    }
  }
} 