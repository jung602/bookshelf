import * as THREE from 'three'
import { BaseModel } from '../objects/BaseModel'
import { WallCube } from '../objects/WallCube'


export class ModelManager {
  private scene: THREE.Scene
  private models: Map<string, BaseModel> = new Map()

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

  // 기존 방식과의 호환성을 위한 오버로드
  public async addModel(model: BaseModel): Promise<void>
  public async addModel(modelType: string, ModelClass: unknown, position?: { x: number; y: number; z: number }): Promise<string | null>
  public async addModel(modelOrType: BaseModel | string, ModelClass?: unknown, position?: { x: number; y: number; z: number }): Promise<string | null | void> {
    // 기존 방식 (BaseModel 인스턴스 전달)
    if (typeof modelOrType !== 'string') {
      const model = modelOrType as BaseModel
      
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
        return
      } catch (error) {
        console.error('Failed to add model:', error)
        throw error
      }
    }
    
    // 새로운 방식 (modelType과 ModelClass 전달)
    const modelType = modelOrType as string
    try {
      const model = new (ModelClass as new (position?: { x: number; y: number; z: number }) => BaseModel)(position)
      await model.load()
      
      // 가구 배치 가능 여부 검사
      const defaultPosition = position || { x: 0, y: 0, z: 0 }
      
      if (model.getType() === 'wallcube') {
        // 벽 가구인 경우
        if (!this.canPlaceOnWall(model, defaultPosition.x, defaultPosition.z)) {
          console.error(`Cannot place ${modelType}: wall is too small or no wall found`)
          model.dispose()
          throw new Error(`벽 가구를 배치할 수 없습니다. 벽이 가구보다 작거나 벽이 없습니다.`)
        }
      } else {
        // 바닥 가구인 경우 - 개선된 검증 로직 적용
        if (!this.canPlaceOnFloor(model, defaultPosition.x, defaultPosition.z)) {
          console.error(`Cannot place ${modelType}: floor is too small or no floor found`)
          model.dispose()
          throw new Error(`바닥 가구를 배치할 수 없습니다. 바닥이 가구보다 작거나 바닥이 없습니다.`)
        }
      }
      
      // 검사를 통과한 경우에만 씬에 추가
      model.addToScene(this.scene)
      this.models.set(model.getId(), model)
      
      console.log(`Model ${modelType} (${model.getId()}) added to scene`)
      return model.getId()
    } catch (error) {
      console.error('Failed to add model:', error)
      return null
    }
  }

  // 벽 큐브 전용 추가 메서드
  public async addWallCube(targetX: number = 0, targetZ: number = 0): Promise<string | null> {
    try {
      const wallCube = new WallCube()
      await wallCube.load()
      
      // 벽에 부착 시도
      const attached = wallCube.attachToWall(this.scene, targetX, targetZ)
      
      if (!attached) {
        console.log('Failed to attach wall cube to any wall')
        wallCube.dispose()
        return null
      }
      
      wallCube.addToScene(this.scene)
      this.models.set(wallCube.getId(), wallCube)
      
      console.log(`WallCube ${wallCube.getId()} added and attached to wall`)
      return wallCube.getId()
    } catch (error) {
      console.error('Failed to add wall cube:', error)
      return null
    }
  }

  // 개선된 바닥 배치 검증 메서드 (현재 버전에서 가져옴)
  public canPlaceOnFloor(model: BaseModel, x: number, z: number): boolean {
    // 바닥 타일이 있는지 확인
    if (!this.hasFloorAt(x, z)) {
      console.log('No floor tile at target position')
      return false
    }

    // 모델의 바운딩 박스가 바닥 경계를 벗어나지 않는지 확인
    const modelGroup = model.getModel()
    if (!modelGroup) return false

    // 임시 위치 변경 후 바운딩박스 계산 (개선된 기법)
    const originalPos = modelGroup.position.clone()
    modelGroup.position.set(x, 0, z)
    const boundingBox = new THREE.Box3().setFromObject(modelGroup)
    modelGroup.position.copy(originalPos)

    // 모든 모서리가 바닥 위에 있는지 확인
    const corners = [
      { x: boundingBox.min.x, z: boundingBox.min.z },
      { x: boundingBox.max.x, z: boundingBox.min.z },
      { x: boundingBox.min.x, z: boundingBox.max.z },
      { x: boundingBox.max.x, z: boundingBox.max.z }
    ]

    const validCorners = corners.filter(corner => this.hasFloorAt(corner.x, corner.z))
    
    if (validCorners.length !== corners.length) {
      const modelWidth = boundingBox.max.x - boundingBox.min.x
      const modelDepth = boundingBox.max.z - boundingBox.min.z
      console.log(`Model ${model.getId()} is too large for available floor space:`)
      console.log(`  Model size: ${modelWidth.toFixed(2)} x ${modelDepth.toFixed(2)}`)
      console.log(`  Valid corners: ${validCorners.length}/${corners.length}`)
      return false
    }

    return true
  }

  // 개선된 바닥 배치 메서드 (현재 버전에서 가져옴)
  public placeOnFloor(model: BaseModel, x: number, z: number): void {
    if (!this.canPlaceOnFloor(model, x, z)) {
      throw new Error('Cannot place furniture at this position - no valid floor')
    }

    const surfaceY = this.calculateSurfaceY(model, x, z)
    model.setPosition({ x, y: surfaceY, z })
  }

  // 벽 가구 배치 가능 여부 확인 (기존 로직 유지)
  public canPlaceOnWall(model: BaseModel, x: number, z: number): boolean {
    const nearestWall = this.findNearestWall(x, z)
    if (!nearestWall) {
      console.log('No wall found near target position')
      return false
    }

    return this.isModelSmallerThanWall(model, nearestWall)
  }

  // 지정된 위치에 바닥이 있는지 확인
  private hasFloorAt(x: number, z: number): boolean {
    const raycaster = new THREE.Raycaster()
    const rayOrigin = new THREE.Vector3(x, 1, z)
    const rayDirection = new THREE.Vector3(0, -1, 0)
    raycaster.set(rayOrigin, rayDirection)

    const floorMeshes: THREE.Mesh[] = []
    this.scene.traverse((child) => {
      if (child.userData.isFloor && child instanceof THREE.Mesh) {
        floorMeshes.push(child)
      }
    })

    const intersections = raycaster.intersectObjects(floorMeshes, false)
    return intersections.length > 0
  }

  // 가장 가까운 벽 찾기
  private findNearestWall(x: number, z: number): THREE.Mesh | null {
    const walls: THREE.Mesh[] = []
    this.scene.traverse((child) => {
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

  // 모델이 벽보다 작은지 확인
  private isModelSmallerThanWall(model: BaseModel, wall: THREE.Mesh): boolean {
    const modelGroup = model.getModel()
    if (!modelGroup) return false

    const modelBox = new THREE.Box3().setFromObject(modelGroup)
    const wallScale = wall.scale

    const modelWidth = modelBox.max.x - modelBox.min.x
    const modelHeight = modelBox.max.y - modelBox.min.y
    
    const wallWidth = wallScale.x
    const wallHeight = wallScale.y

    const canFit = modelWidth < wallWidth && modelHeight < wallHeight
    
    if (!canFit) {
      console.log(`Model ${model.getId()} is too large for wall:`)
      console.log(`  Model size: ${modelWidth.toFixed(2)} x ${modelHeight.toFixed(2)} (W x H)`)
      console.log(`  Wall size: ${wallWidth.toFixed(2)} x ${wallHeight.toFixed(2)} (W x H)`)
    }

    return canFit
  }

  // 기존 04a630c 커밋의 메서드들 유지하면서 개선사항 적용
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

  public calculateSurfaceY(targetModel: BaseModel, x: number, z: number, excludeModelIds: string[] = []): number {
    const raycaster = new THREE.Raycaster()
    
    // 위에서 아래로 레이캐스팅 (충분히 높은 위치에서 시작)
    const rayOrigin = new THREE.Vector3(x, 10, z)
    const rayDirection = new THREE.Vector3(0, -1, 0)
    raycaster.set(rayOrigin, rayDirection)

    console.log(`📍 Calculating surface Y for ${targetModel.getId()} at (${x.toFixed(3)}, ${z.toFixed(3)})`)
    if (excludeModelIds.length > 0) {
      console.log(`  Excluding models: ${excludeModelIds.join(', ')}`)
    }

    // 다른 모든 모델의 콜라이더 수집 (자기 자신과 제외 목록 제외)
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
            console.log(`  Added ${validColliders.length} valid colliders from model ${modelId}`)
          }
        }
      }
    })

    // 바닥도 포함
    const floorMeshes: THREE.Mesh[] = []
    this.scene.traverse((child) => {
      if (child.userData.isFloor && child instanceof THREE.Mesh) {
        floorMeshes.push(child)
      }
    })
    colliders.push(...floorMeshes)
    console.log(`  Added ${floorMeshes.length} floor meshes`)
    console.log(`  Total colliders: ${colliders.length}`)

    // 레이캐스팅 실행
    const intersections = raycaster.intersectObjects(colliders, false)
    console.log(`  Found ${intersections.length} intersections`)
    
    if (intersections.length > 0) {
      // 가장 높은 유효한 표면 찾기
      let bestSurfaceY = -Infinity
      
      for (const intersection of intersections) {
        const surfaceY = intersection.point.y
        const isFloorMesh = intersection.object.userData.isFloor
        
        if (isFloorMesh) {
          // 바닥이면 항상 유효
          bestSurfaceY = Math.max(bestSurfaceY, surfaceY)
          console.log(`  Floor surface at Y: ${surfaceY.toFixed(3)}`)
        } else {
          // 다른 가구의 표면인 경우 지지 가능한지 확인
          const surfaceModelId = intersection.object.userData.modelId
          const surfaceModel = this.models.get(surfaceModelId)
          
          if (surfaceModel && this.canModelSupportAnother(surfaceModel, targetModel, x, z)) {
            bestSurfaceY = Math.max(bestSurfaceY, surfaceY)
            console.log(`  Valid model surface at Y: ${surfaceY.toFixed(3)} from ${surfaceModelId}`)
          } else {
            console.log(`  Invalid surface at Y: ${surfaceY.toFixed(3)} from ${surfaceModelId}`)
          }
        }
      }
      
      if (bestSurfaceY > -Infinity) {
        // 타겟 모델의 바운딩 박스를 고려하여 Y 위치 계산 (개선된 방식)
        const modelBottomOffset = this.getModelBottomOffset(targetModel)
        const finalY = bestSurfaceY - modelBottomOffset
        
        console.log(`  Best surface Y: ${bestSurfaceY.toFixed(3)}, bottom offset: ${modelBottomOffset.toFixed(3)}, final Y: ${finalY.toFixed(3)}`)
        
        // 바닥 높이 검증 추가 (개선사항)
        if (bestSurfaceY <= 0.01 && modelBottomOffset < 0) {
          console.log(`  ✓ Correct floor placement`)
        } else if (finalY > 2) {
          console.log(`  ⚠️ WARNING: Suspiciously high Y position!`)
        }
        
        return finalY
      }
    }

    // 교차점이 없거나 유효한 표면이 없으면 바닥 기본 높이
    const floorY = this.getFloorHeight(x, z)
    const modelBottomOffset = this.getModelBottomOffset(targetModel)
    const finalY = floorY - modelBottomOffset
    
    console.log(`  No valid model surface found`)
    console.log(`  Floor Y: ${floorY.toFixed(3)}, Model bottom offset: ${modelBottomOffset.toFixed(3)}`)
    console.log(`  Final Y position: ${finalY.toFixed(3)}`)
    
    return finalY
  }

  // 개선된 모델 간 지지 관계 확인 (현재 버전 기반)
  private canModelSupportAnother(supportModel: BaseModel, targetModel: BaseModel, targetX: number, targetZ: number): boolean {
    const supportModelGroup = supportModel.getModel()
    const targetModelGroup = targetModel.getModel()
    
    if (!supportModelGroup || !targetModelGroup) return false

    // 지지 모델의 바운딩 박스
    const supportBox = new THREE.Box3().setFromObject(supportModelGroup)
    
    // 타겟 모델을 임시로 목표 위치에 배치하여 바운딩 박스 계산 (개선된 기법)
    const originalTargetPosition = targetModelGroup.position.clone()
    targetModelGroup.position.set(targetX, 0, targetZ)
    const targetBox = new THREE.Box3().setFromObject(targetModelGroup)
    targetModelGroup.position.copy(originalTargetPosition)
    
    // X, Z 축에서의 겹침 계산
    const xOverlap = Math.min(targetBox.max.x, supportBox.max.x) - Math.max(targetBox.min.x, supportBox.min.x)
    const zOverlap = Math.min(targetBox.max.z, supportBox.max.z) - Math.max(targetBox.min.z, supportBox.min.z)
    
    // 겹침이 없으면 지지할 수 없음
    if (xOverlap <= 0 || zOverlap <= 0) {
      console.log(`    No overlap between models (xOverlap=${xOverlap.toFixed(3)}, zOverlap=${zOverlap.toFixed(3)})`)
      return false
    }
    
    // 겹치는 영역 계산
    const overlapArea = xOverlap * zOverlap
    const targetArea = (targetBox.max.x - targetBox.min.x) * (targetBox.max.z - targetBox.min.z)
    const overlapRatio = overlapArea / targetArea
    
    // 타겟 모델의 30% 이상이 지지 모델 위에 있어야 함
    const canSupport = overlapRatio >= 0.3
    
    console.log(`    Support check: ${supportModel.getId()} -> ${targetModel.getId()}: overlap ratio=${overlapRatio.toFixed(2)}, can support=${canSupport}`)
    
    return canSupport
  }

  // 개선된 모델 하단 오프셋 계산 (더 자세한 로깅)
  private getModelBottomOffset(model: BaseModel): number {
    const modelGroup = model.getModel()
    if (!modelGroup) {
      console.log(`  Warning: No model group found for ${model.getId()}`)
      return 0
    }

    const boundingBox = new THREE.Box3().setFromObject(modelGroup)
    const bottomOffset = boundingBox.min.y - modelGroup.position.y
    
    console.log(`  Model ${model.getId()} bottom calculation:`)
    console.log(`    Bounding box min.y: ${boundingBox.min.y.toFixed(3)}`)
    console.log(`    Model position.y: ${modelGroup.position.y.toFixed(3)}`)
    console.log(`    Bottom offset: ${bottomOffset.toFixed(3)}`)
    
    // 오프셋이 양수라면 문제가 있음 (개선된 경고)
    if (bottomOffset > 0.1) {
      console.log(`    ⚠️ Unusual positive bottom offset: ${bottomOffset.toFixed(3)}`)
    }
    
    return bottomOffset
  }

  // 바닥 높이 가져오기
  private getFloorHeight(x: number, z: number): number {
    const raycaster = new THREE.Raycaster()
    const rayOrigin = new THREE.Vector3(x, 1, z)
    const rayDirection = new THREE.Vector3(0, -1, 0)
    raycaster.set(rayOrigin, rayDirection)

    const floorMeshes: THREE.Mesh[] = []
    this.scene.traverse((child) => {
      if (child.userData.isFloor && child instanceof THREE.Mesh) {
        floorMeshes.push(child)
      }
    })

    const intersections = raycaster.intersectObjects(floorMeshes, false)
    return intersections.length > 0 ? intersections[0].point.y : 0
  }

  // 기존 04a630c 메서드들 유지
  public async removeModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId)
    if (model) {
      console.log(`Starting removal of model ${modelId}`)
      console.log(`Current models before removal:`, Array.from(this.models.keys()))
      
      // 삭제 전에 모델 위치 저장
      const removedPosition = model.getPosition()
      
      // 삭제될 모델 위에 있는 모델들을 찾기
      const affectedModels = this.findModelsAffectedByRemoval(modelId)
      console.log(`Found ${affectedModels.length} models affected by removal of ${modelId}:`, affectedModels)
      
      model.removeFromScene(this.scene)
      model.dispose()
      this.models.delete(modelId)
      
      console.log(`Model ${modelId} removed, remaining models:`, Array.from(this.models.keys()))
      
      // 영향받는 모델들만 선택적으로 재계산
      if (affectedModels.length > 0) {
        console.log('Model removed - recalculating positions for affected models...')
        await this.recalculateAffectedModelPositions(affectedModels, removedPosition)
      } else {
        console.log('No models affected by removal - skipping recalculation')
      }
      
      console.log(`Model ${modelId} removed from scene and affected model positions recalculated`)
    } else {
      console.log(`Model ${modelId} not found for removal`)
    }
  }

  // 나머지 기존 메서드들도 유지...
  public getModel(modelId: string): BaseModel | undefined {
    return this.models.get(modelId)
  }

  public getAllModels(): BaseModel[] {
    return Array.from(this.models.values())
  }

  public getModelInfo(): Array<{ id: string; type: string; position: { x: number; y: number; z: number } }> {
    return this.getAllModels().map(model => ({
      id: model.getId(),
      type: model.getType(),
      position: model.getPosition()
    }))
  }

  public rotateModel(modelId: string): void {
    const model = this.models.get(modelId)
    if (model) {
      model.rotateY90()
      console.log(`Model ${modelId} rotated 90 degrees`)
    }
  }

  // 벽 가구 이동 메서드
  private moveWallModel(modelId: string, x: number, z: number, y?: number): void {
    const model = this.models.get(modelId)
    if (!model || model.getType() !== 'wallcube') return

    // TODO: WallCube 클래스의 attachToWall 메서드 구현 필요
    console.log(`Moving wall model ${modelId} to (${x}, ${y || 'default'}, ${z})`)
    
    // 임시로 직접 위치 설정
    model.setPosition({ x, y: y || 1, z })
  }

  // 모델 이동 메서드 (벽/바닥 가구 구분)
  public moveModel(modelId: string, x: number, z: number, y?: number): void {
    const model = this.models.get(modelId)
    if (!model) return

    // 벽 가구인지 확인
    if (model.getType() === 'wallcube') {
      this.moveWallModel(modelId, x, z, y)
      return
    }

    // 바닥 가구 이동 로직
    if (!this.hasFloorMeshes()) {
      console.log('No floor available - cannot move model')
      return
    }

    const clampedPosition = this.clampToFloorWithBounds(model, x, z)
    const modelY = this.calculateSurfaceY(model, clampedPosition.x, clampedPosition.z)
    model.setPosition({
      x: clampedPosition.x,
      y: modelY,
      z: clampedPosition.z
    })

    console.log(`Model ${modelId} moved to (${clampedPosition.x}, ${modelY}, ${clampedPosition.z})`)
  }

  // 드래그 후 다른 모델들 재계산 (InteractionManager에서 호출)
  public async recalculateOtherModelPositions(excludeModelId: string): Promise<void> {
    console.log(`Recalculating positions for other models (excluding ${excludeModelId})`)
    
    const otherModels = Array.from(this.models.keys()).filter(id => 
      id !== excludeModelId && this.models.get(id)?.getType() !== 'wallcube'
    )
    
    if (otherModels.length > 0) {
      // 임시 위치 정보 (드래그된 모델의 위치)
      const draggedModel = this.models.get(excludeModelId)
      const tempPosition = draggedModel ? draggedModel.getPosition() : { x: 0, y: 0, z: 0 }
      
      await this.recalculateAffectedModelPositions(otherModels, tempPosition)
    }
  }

  public setModelVisibility(modelId: string, visible: boolean): void {
    const model = this.models.get(modelId)
    if (model) {
      model.setVisible(visible)
    }
  }

  public update(): void {
    this.models.forEach((model) => {
      model.update()
    })
  }

  public dispose(): void {
    this.models.forEach((model) => {
      model.removeFromScene(this.scene)
      model.dispose()
    })
    this.models.clear()
  }



  // 기존 04a630c 커밋의 나머지 복잡한 로직들
  
  private findModelsAffectedByRemoval(removedModelId: string): string[] {
    const removedModel = this.models.get(removedModelId)
    if (!removedModel) return []

    const affectedModels: string[] = []
    const removedPosition = removedModel.getPosition()

    console.log(`=== Finding models affected by removal of ${removedModelId} ===`)
    console.log(`Removed model position: (${removedPosition.x.toFixed(3)}, ${removedPosition.y.toFixed(3)}, ${removedPosition.z.toFixed(3)})`)

    // 가장 아래 모델인지 확인 (삭제될 모델을 제외한 바닥 가구들과 비교)
    const floorModels = Array.from(this.models.values()).filter(model => 
      model.getType() !== 'wallcube' && model.getId() !== removedModelId
    )
    
    const isLowestModel = floorModels.length === 0 || 
      floorModels.every(model => model.getPosition().y >= removedPosition.y - 0.1)

    console.log(`Is ${removedModelId} the lowest model? ${isLowestModel}`)

    if (isLowestModel) {
      // 가장 아래 모델이면 위의 모든 바닥 가구들이 영향받음
      console.log(`  -> ${removedModelId} is the lowest model - all models above will be affected`)
      
      this.models.forEach((model, modelId) => {
        if (modelId === removedModelId || model.getType() === 'wallcube') return
        
        const modelPosition = model.getPosition()
        
        // 삭제될 모델과 같은 위치 또는 위에 있는 모든 모델들
        if (modelPosition.y >= removedPosition.y - 0.2) {
          affectedModels.push(modelId)
          console.log(`      ✅ Model ${modelId} is affected (above lowest model) at Y: ${modelPosition.y.toFixed(3)}`)
        }
      })
    } else {
      // 일반적인 경우: 직접 지지 관계 확인
      this.models.forEach((model, modelId) => {
        if (modelId === removedModelId || model.getType() === 'wallcube') return

        const modelPosition = model.getPosition()
        
        // 삭제될 모델보다 위에 있는 모델들만 확인
        if (modelPosition.y > removedPosition.y + 0.1) {
          // 삭제될 모델이 이 모델을 지지하고 있는지 확인
          if (this.canModelSupportAnother(removedModel, model, modelPosition.x, modelPosition.z)) {
            affectedModels.push(modelId)
            console.log(`      ✅ Model ${modelId} is supported by removed model`)
          }
        }
      })
    }

    console.log(`  -> Total affected models found: ${affectedModels.length}`)
    return affectedModels
  }

  private async recalculateAffectedModelPositions(affectedModelIds: string[], removedPosition: { x: number; y: number; z: number }): Promise<void> {
    console.log('=== Starting position recalculation for affected models ===')
    console.log(`Affected models to recalculate: ${affectedModelIds.length}`, affectedModelIds)
    console.log(`Removed model was at position: (${removedPosition.x.toFixed(3)}, ${removedPosition.y.toFixed(3)}, ${removedPosition.z.toFixed(3)})`)
    
    // Y 위치 순으로 정렬 (아래에서 위로 재계산)
    const sortedModels = affectedModelIds
      .map(id => ({ id, model: this.models.get(id)! }))
      .filter(item => item.model && item.model.isModelLoaded())
      .sort((a, b) => a.model.getPosition().y - b.model.getPosition().y)

    console.log(`Sorted models for recalculation:`, sortedModels.map(item => 
      `${item.id} (Y: ${item.model.getPosition().y.toFixed(3)})`))

    // 가장 아래 모델이 삭제된 경우인지 확인
    const remainingFloorModels = Array.from(this.models.values()).filter(model => 
      model.getType() !== 'wallcube'
    )
    
    let isLowestModelRemoved = false
    if (remainingFloorModels.length === 0) {
      // 모든 바닥 모델이 삭제됨
      isLowestModelRemoved = true
    } else {
      // 삭제된 모델이 남은 모델들보다 낮거나 같은 위치에 있었다면 가장 아래 모델이 삭제된 것
      const lowestRemainingY = Math.min(...remainingFloorModels.map(m => m.getPosition().y))
      isLowestModelRemoved = removedPosition.y <= lowestRemainingY + 0.1
    }
    
    console.log(`Is lowest model removed? ${isLowestModelRemoved} (removed Y: ${removedPosition.y.toFixed(3)}, lowest remaining Y: ${remainingFloorModels.length > 0 ? Math.min(...remainingFloorModels.map(m => m.getPosition().y)).toFixed(3) : 'none'})`)

    if (isLowestModelRemoved) {
      // 가장 아래 모델이 삭제된 경우: 모든 모델을 바닥부터 다시 쌓기
      console.log('🔧 Lowest model removed - rebuilding all affected models from floor')
      console.log(`🔧 Rebuilding ${sortedModels.length} models in order:`)
      
      for (let i = 0; i < sortedModels.length; i++) {
        const { id, model } = sortedModels[i]
        const currentPosition = model.getPosition()
        console.log(`🔧 [${i + 1}/${sortedModels.length}] Rebuilding model ${id} (current Y: ${currentPosition.y.toFixed(3)})`)
        
        if (i === 0) {
          // 첫 번째 모델: 바닥에 직접 배치
          try {
            const floorY = this.calculateModelFloorY(model)
            console.log(`  -> 🔧 Placing first model ${id} on floor Y: ${floorY.toFixed(3)}`)
            model.setPosition({
              x: currentPosition.x,
              y: floorY,
              z: currentPosition.z
            })
            
            // 강제로 world matrix 업데이트 (다음 모델 계산을 위해)
            const threeModel = model.getModel()
            if (threeModel) {
              threeModel.updateMatrixWorld(true)
            }
            
            const newPosition = model.getPosition()
            console.log(`  -> ✅ First model ${id} now at Y: ${newPosition.y.toFixed(3)}`)
          } catch (error) {
            console.log(`  -> ⚠️ Cannot calculate floor Y for first model ${id}:`, error)
          }
        } else {
          // 나머지 모델들: 이미 배치된 모델들을 고려하여 배치
          try {
            // 이전 모델들의 collider가 업데이트되었는지 확인
            console.log(`  -> 🔍 Calculating surface Y for model ${id} at position (${currentPosition.x.toFixed(3)}, ${currentPosition.z.toFixed(3)})`)
            
            // 약간의 지연을 추가하여 이전 모델의 위치 업데이트가 완전히 반영되도록 함
            await new Promise(resolve => setTimeout(resolve, 10))
            
            const newY = this.calculateSurfaceY(model, currentPosition.x, currentPosition.z)
            console.log(`  -> 🔧 Placing model ${id} on calculated surface Y: ${newY.toFixed(3)} (was at Y: ${currentPosition.y.toFixed(3)})`)
            model.setPosition({
              x: currentPosition.x,
              y: newY,
              z: currentPosition.z
            })
            
            // 이 모델도 world matrix 업데이트
            const threeModel = model.getModel()
            if (threeModel) {
              threeModel.updateMatrixWorld(true)
            }
            
            const finalPosition = model.getPosition()
            console.log(`  -> ✅ Model ${id} now at Y: ${finalPosition.y.toFixed(3)}`)
          } catch (error) {
            console.log(`  -> ⚠️ Cannot calculate surface Y for model ${id}:`, error)
          }
        }
      }
      
      console.log('🔧 All affected models rebuilt from floor - final positions:')
      sortedModels.forEach(({ id, model }) => {
        const pos = model.getPosition()
        console.log(`  -> Model ${id}: Y = ${pos.y.toFixed(3)}`)
      })
    } else {
      // 일반적인 경우: 기존 로직 사용
      let hasChanges = true
      let iterations = 0
      const maxIterations = 10
      
      while (hasChanges && iterations < maxIterations) {
        hasChanges = false
        iterations++
        
        console.log(`=== Affected models recalculation iteration ${iterations} ===`)
        
        for (const { id, model } of sortedModels) {
          const currentPosition = model.getPosition()
          console.log(`Checking affected model ${id} at position (${currentPosition.x.toFixed(3)}, ${currentPosition.y.toFixed(3)}, ${currentPosition.z.toFixed(3)})`)
          
          try {
            const newY = this.calculateSurfaceY(model, currentPosition.x, currentPosition.z)
            console.log(`  -> Calculated surface Y: ${newY.toFixed(3)}`)
            
            if (Math.abs(currentPosition.y - newY) > 0.001) {
              model.setPosition({
                x: currentPosition.x,
                y: newY,
                z: currentPosition.z
              })
              
              hasChanges = true
              console.log(`  -> ✅ Affected model ${id} repositioned from Y:${currentPosition.y.toFixed(3)} to Y:${newY.toFixed(3)}`)
            } else {
              console.log(`  -> ⏸️ Affected model ${id} position unchanged (difference: ${Math.abs(currentPosition.y - newY).toFixed(3)})`)
            }
          } catch {
            console.log(`  -> ⚠️ Cannot calculate surface Y for affected model ${id}: No floor available`)
          }
        }
      }
      
      console.log(`=== Affected models recalculation completed after ${iterations} iterations ===`)
    }
  }

  // 충돌 감지 및 자동 올라가기 기능 (개선된 에러 처리)
  public checkCollisionAndAdjust(targetModel: BaseModel, newX: number, newY: number, newZ: number): { x: number, y: number, z: number } {
    const targetModelGroup = targetModel.getModel()
    if (!targetModelGroup) {
      return { x: newX, y: Math.max(0, newY), z: newZ }
    }

    // 바닥이 없으면 원래 위치 유지 (개선된 에러 처리)
    if (!this.hasFloorMeshes()) {
      console.log('No floor available - keeping original position')
      const currentPosition = targetModel.getPosition()
      return { 
        x: currentPosition.x, 
        y: Math.max(0, currentPosition.y), 
        z: currentPosition.z 
      }
    }

    // 개선된 바운딩박스를 이용한 경계 체크
    const clampedPosition = this.clampToFloorWithBounds(targetModel, newX, newZ)
    const adjustedX = clampedPosition.x
    const adjustedZ = clampedPosition.z

    try {
      const surfaceY = this.calculateSurfaceY(targetModel, adjustedX, adjustedZ)
      const clampedSurfaceY = Math.max(0, surfaceY)
      return {
        x: adjustedX,
        y: clampedSurfaceY,
        z: adjustedZ
      }
    } catch {
      // 개선된 폴백 처리
      console.log('Cannot find valid surface - keeping original position')
      const currentPosition = targetModel.getPosition()
      return { 
        x: currentPosition.x, 
        y: Math.max(0, currentPosition.y), 
        z: currentPosition.z 
      }
    }
  }

  // 헬퍼 메서드들

  public clampToFloorWithBounds(model: BaseModel, x: number, z: number): { x: number, z: number } {
    const modelGroup = model.getModel()
    if (!modelGroup) return { x, z }

    // 바닥 메시들의 경계 계산
    const floorBounds = this.getFloorBounds()
    if (!floorBounds) {
      console.log('No floor bounds found, returning original position')
      return { x, z }
    }

    // 모델의 바운딩박스를 목표 위치에서 계산
    const originalPos = modelGroup.position.clone()
    modelGroup.position.set(x, 0, z)
    const modelBoundingBox = new THREE.Box3().setFromObject(modelGroup)
    modelGroup.position.copy(originalPos)

    // 모델의 경계가 바닥 경계를 벗어나지 않도록 조정
    let clampedX = x
    let clampedZ = z

    // X축 경계 체크
    if (modelBoundingBox.min.x < floorBounds.minX) {
      clampedX = x + (floorBounds.minX - modelBoundingBox.min.x)
    } else if (modelBoundingBox.max.x > floorBounds.maxX) {
      clampedX = x - (modelBoundingBox.max.x - floorBounds.maxX)
    }

    // Z축 경계 체크
    if (modelBoundingBox.min.z < floorBounds.minZ) {
      clampedZ = z + (floorBounds.minZ - modelBoundingBox.min.z)
    } else if (modelBoundingBox.max.z > floorBounds.maxZ) {
      clampedZ = z - (modelBoundingBox.max.z - floorBounds.maxZ)
    }

    console.log(`Clamping model from (${x.toFixed(2)}, ${z.toFixed(2)}) to (${clampedX.toFixed(2)}, ${clampedZ.toFixed(2)})`)
    
    return { x: clampedX, z: clampedZ }
  }

  // 바닥의 전체 경계를 계산하는 헬퍼 메서드
  private getFloorBounds(): { minX: number, maxX: number, minZ: number, maxZ: number } | null {
    const floorMeshes: THREE.Mesh[] = []
    this.scene.traverse((child) => {
      if (child.userData.isFloor && child instanceof THREE.Mesh) {
        floorMeshes.push(child)
      }
    })

    if (floorMeshes.length === 0) return null

    let minX = Infinity, maxX = -Infinity
    let minZ = Infinity, maxZ = -Infinity

    floorMeshes.forEach(mesh => {
      const boundingBox = new THREE.Box3().setFromObject(mesh)
      minX = Math.min(minX, boundingBox.min.x)
      maxX = Math.max(maxX, boundingBox.max.x)
      minZ = Math.min(minZ, boundingBox.min.z)
      maxZ = Math.max(maxZ, boundingBox.max.z)
    })

    return { minX, maxX, minZ, maxZ }
  }
}