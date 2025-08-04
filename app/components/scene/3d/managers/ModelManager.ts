import * as THREE from 'three'
import { BaseModel } from '../objects/BaseModel'
import { WallCube } from '../objects/WallCube'

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

  // 벽 큐브 전용 추가 메서드
  public async addWallCube(targetX: number = 0, targetZ: number = 0): Promise<string | null> {
    try {
      const wallCube = new WallCube()
      await wallCube.load()
      
      // 벽에 부착 시도
      const attached = wallCube.attachToWall(this.scene, targetX, targetZ)
      
      if (!attached) {
        console.log('Failed to attach wall cube to any wall')
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

  public getModel(modelId: string): BaseModel | undefined {
    return this.models.get(modelId)
  }

  public getAllModels(): BaseModel[] {
    return Array.from(this.models.values())
  }

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

  // 벽 가구 이동 전용 메서드 (Y 위치 포함)
  private moveWallModel(modelId: string, x: number, z: number, y?: number): void {
    const model = this.models.get(modelId)
    if (!model || model.getType() !== 'wallcube') return

    const wallCube = model as WallCube
    
    // 새로운 위치에서 벽에 다시 부착 시도 (Y 위치 포함)
    const attached = wallCube.attachToWall(this.scene, x, z, y)
    
    if (attached) {
      console.log(`Wall model ${modelId} moved and reattached to wall at Y: ${y?.toFixed(3) || 'default'}`)
    } else {
      console.log(`Failed to reattach wall model ${modelId} to wall`)
    }
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
    // const modelWidth = box.max.x - box.min.x
    // const modelDepth = box.max.z - box.min.z
    
    // 가장 가까운 유효한 타일 찾기
    const nearestTile = this.findNearestFloorTile(centerX, centerZ)
    if (!nearestTile) {
      return { x, z } // 유효한 타일이 없으면 원래 위치 유지
    }

    // 모델의 중심이 해당 타일에 오도록 조정
    const adjustedX = nearestTile.x
    const adjustedZ = nearestTile.z

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

    // 다른 모든 모델의 콜라이더 수집 (자기 자신 제외)
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
      // 모든 교차점을 지지 가능성과 표면 Y값으로 평가
      const validSurfaces: { y: number; modelId: string | null; isFloor: boolean; supportQuality: number }[] = []
      
      for (const intersection of intersections) {
        const surfaceY = intersection.point.y
        const isFloorMesh = intersection.object.userData.isFloor
        
        if (isFloorMesh) {
          // 바닥이면 항상 유효한 표면 (최고 품질)
          validSurfaces.push({
            y: surfaceY,
            modelId: null,
            isFloor: true,
            supportQuality: 1.0
          })
          console.log(`      -> Found floor surface at Y: ${surfaceY.toFixed(3)} (quality: 1.0)`)
        } else {
          // 다른 모델의 표면인 경우, 지지 품질 평가
          const surfaceModelId = intersection.object.userData.modelId
          const surfaceModel = this.models.get(surfaceModelId)
          
          if (surfaceModel && this.canModelSupportAnother(surfaceModel, targetModel, x, z)) {
            // 지지 품질 계산 (면적 비율과 겹침 정도에 따라)
            const supportQuality = this.calculateSupportQuality(surfaceModel, targetModel, x, z)
            
            validSurfaces.push({
              y: surfaceY,
              modelId: surfaceModelId,
              isFloor: false,
              supportQuality: supportQuality
            })
            console.log(`      -> Found model surface at Y: ${surfaceY.toFixed(3)} from ${surfaceModelId} (quality: ${supportQuality.toFixed(2)})`)
          } else {
            console.log(`      -> Rejected surface at Y: ${surfaceY.toFixed(3)} from model ${surfaceModelId} (cannot support)`)
          }
        }
      }
      
      if (validSurfaces.length > 0) {
        // 가장 높은 위치에 있는 유효한 표면 선택
        // 높이가 같다면 지지 품질이 더 좋은 것 선택
        validSurfaces.sort((a, b) => {
          if (Math.abs(a.y - b.y) < 0.001) {
            return b.supportQuality - a.supportQuality // 품질 높은 순
          }
          return b.y - a.y // 높이 높은 순
        })
        
        const bestSurface = validSurfaces[0]
        
        // 타겟 모델의 바운딩 박스를 고려하여 Y 위치 계산
        const modelBottomOffset = this.getModelBottomOffset(targetModel)
        
        // 표면 Y 위치에서 모델의 바닥 오프셋을 빼서 모델의 중심 위치 계산
        const finalY = bestSurface.y - modelBottomOffset
        
        // 부동소수점 정밀도 문제 해결을 위해 소수점 4자리에서 반올림
        const roundedY = Math.round(finalY * 10000) / 10000
        
        console.log(`      -> Best surface: ${bestSurface.isFloor ? 'floor' : bestSurface.modelId} at Y: ${bestSurface.y.toFixed(3)} (quality: ${bestSurface.supportQuality.toFixed(2)})`)
        console.log(`      -> Model bottom offset: ${modelBottomOffset.toFixed(3)}, final Y: ${finalY.toFixed(3)}, rounded Y: ${roundedY.toFixed(3)}`)
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
    
    // 각 모델의 크기 계산
    const supportWidth = supportBox.max.x - supportBox.min.x
    const supportDepth = supportBox.max.z - supportBox.min.z
    const supportArea = supportWidth * supportDepth
    
    const targetWidth = targetBox.max.x - targetBox.min.x
    const targetDepth = targetBox.max.z - targetBox.min.z
    const targetArea = targetWidth * targetDepth
    
    // X, Z 축에서의 겹침 계산
    const xOverlap = Math.min(targetBox.max.x, supportBox.max.x) - Math.max(targetBox.min.x, supportBox.min.x)
    const zOverlap = Math.min(targetBox.max.z, supportBox.max.z) - Math.max(targetBox.min.z, supportBox.min.z)
    
    // 겹침이 없으면 지지할 수 없음
    if (xOverlap <= 0 || zOverlap <= 0) {
      console.log(`      -> Support check FAILED: No overlap (xOverlap=${xOverlap.toFixed(3)}, zOverlap=${zOverlap.toFixed(3)})`)
      return false
    }
    
    // 겹치는 영역의 크기
    const overlapArea = xOverlap * zOverlap
    
    // 타겟 모델 대비 겹침 비율
    const targetOverlapRatio = overlapArea / targetArea
    
    // 지지 모델 대비 겹침 비율
    const supportOverlapRatio = overlapArea / supportArea
    
    // 개선된 지지 조건:
    // 1. 타겟이 더 작고 (면적 기준), 충분히 겹치는 경우
    // 2. 또는 타겟이 크더라도 지지 모델에 충분히 안착하는 경우
    let canSupport = false
    
    if (targetArea <= supportArea) {
      // 타겟이 더 작거나 같은 경우: 30% 이상 겹치면 지지 가능
      canSupport = targetOverlapRatio >= 0.3
      console.log(`      -> Target is smaller/equal: targetArea=${targetArea.toFixed(2)}, supportArea=${supportArea.toFixed(2)}, targetOverlapRatio=${targetOverlapRatio.toFixed(2)}`)
    } else {
      // 타겟이 더 큰 경우: 지지 모델의 80% 이상을 덮어야 지지 가능
      canSupport = supportOverlapRatio >= 0.8
      console.log(`      -> Target is larger: targetArea=${targetArea.toFixed(2)}, supportArea=${supportArea.toFixed(2)}, supportOverlapRatio=${supportOverlapRatio.toFixed(2)}`)
    }
    
    // 추가 조건: 너무 작은 겹침은 불안정하므로 최소 겹침 크기 확보
    const minOverlapSize = Math.min(targetWidth, targetDepth) * 0.2 // 타겟의 최소 변의 20%
    const actualMinOverlap = Math.min(xOverlap, zOverlap)
    
    if (actualMinOverlap < minOverlapSize) {
      console.log(`      -> Support check FAILED: Insufficient minimum overlap (${actualMinOverlap.toFixed(3)} < ${minOverlapSize.toFixed(3)})`)
      canSupport = false
    }
    
    console.log(`      -> Support check: ${supportModel.getId()} -> ${targetModel.getId()}: overlapArea=${overlapArea.toFixed(2)}, targetRatio=${targetOverlapRatio.toFixed(2)}, supportRatio=${supportOverlapRatio.toFixed(2)}, canSupport=${canSupport}`)
    
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

  // 삭제될 모델에 의해 영향받는 모델들을 찾는 메서드
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
      console.log(`  -> Checking all remaining models:`)
      
      this.models.forEach((model, modelId) => {
        if (modelId === removedModelId || model.getType() === 'wallcube') return
        
        const modelPosition = model.getPosition()
        console.log(`    -> Model ${modelId} at Y: ${modelPosition.y.toFixed(3)} (removed was at Y: ${removedPosition.y.toFixed(3)})`)
        
        // 삭제될 모델과 같은 위치 또는 위에 있는 모든 모델들 (조건을 더 관대하게)
        if (modelPosition.y >= removedPosition.y - 0.2) {
          affectedModels.push(modelId)
          console.log(`      ✅ Model ${modelId} is affected (above lowest model) at Y: ${modelPosition.y.toFixed(3)}`)
        } else {
          console.log(`      ❌ Model ${modelId} is NOT affected (too low) at Y: ${modelPosition.y.toFixed(3)}`)
        }
      })
      
      console.log(`  -> Total affected models found: ${affectedModels.length}`)
    } else {
      // 일반적인 경우: 직접 지지 관계 확인
      this.models.forEach((model, modelId) => {
        if (modelId === removedModelId || model.getType() === 'wallcube') return

        const modelPosition = model.getPosition()
        
        // 삭제될 모델보다 위에 있는 모델들만 확인
        if (modelPosition.y > removedPosition.y + 0.1) {
          // 삭제될 모델이 이 모델을 지지하고 있는지 확인
          if (this.isModelSupportedBy(model, removedModel)) {
            affectedModels.push(modelId)
            console.log(`  -> Model ${modelId} is affected (supported by removed model)`)
          }
        }
      })

      // 연쇄적으로 영향받는 모델들도 찾기 (재귀적으로, 더 강화된 로직)
      const allAffected = new Set(affectedModels)
      const findChainReaction = (affectedIds: string[], depth: number = 0) => {
        if (depth > 10) return // 무한 재귀 방지
        
        const newAffected: string[] = []
        
        affectedIds.forEach(affectedId => {
          const affectedModel = this.models.get(affectedId)
          if (!affectedModel) return

          const affectedPosition = affectedModel.getPosition()

          // 이 모델 위에 있는 다른 모든 모델들 찾기 (지지 관계 확인)
          this.models.forEach((model, modelId) => {
            if (allAffected.has(modelId) || modelId === removedModelId || model.getType() === 'wallcube') return

            const modelPosition = model.getPosition()
            
            // 위에 있고 지지 관계가 있는지 확인
            if (modelPosition.y > affectedPosition.y + 0.1) {
              if (this.isModelSupportedBy(model, affectedModel)) {
                allAffected.add(modelId)
                newAffected.push(modelId)
                console.log(`  -> Model ${modelId} is affected by chain reaction (depth ${depth + 1}) - supported by ${affectedId}`)
              }
            }
          })
        })

        if (newAffected.length > 0) {
          findChainReaction(newAffected, depth + 1)
        }
      }

      findChainReaction(affectedModels)
      return Array.from(allAffected)
    }

    return affectedModels
  }

  // 한 모델이 다른 모델에 의해 지지되고 있는지 확인
  private isModelSupportedBy(supportedModel: BaseModel, supportingModel: BaseModel): boolean {
    const supportedPos = supportedModel.getPosition()
    const supportingPos = supportingModel.getPosition()

    // Y 위치 차이가 적절한 범위 내에 있는지 확인 (지지 관계)
    const yDiff = supportedPos.y - supportingPos.y
    if (yDiff < 0.1 || yDiff > 4.0) return false // 범위를 넓혀서 더 많은 지지 관계 감지

    // X, Z 위치에서 겹침이 있는지 확인
    return this.canModelSupportAnother(supportingModel, supportedModel, supportedPos.x, supportedPos.z)
  }

  // 영향받는 모델들만 재계산하는 메서드
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
      sortedModels.forEach(({ id, model }, i) => {
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
      
      // 바닥 가구에 대해서만 현재 X, Z 위치에서 올바른 Y 위치를 재계산 (벽 가구는 제외)
      this.models.forEach((model) => {
        if (model.isModelLoaded() && model.getType() !== 'wallcube') { // 벽 가구는 바닥 계산에서 제외
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
          } catch {
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
    
    // 제외된 모델을 제외한 바닥 가구만 수집 (벽 가구는 제외)
    const modelsToRecalculate: BaseModel[] = []
    this.models.forEach((model) => {
      if (model.getId() !== excludeModelId && 
          model.isModelLoaded() && 
          model.getType() !== 'wallcube') { // 벽 가구는 바닥 계산에서 제외
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
    const maxIterations = 6 // 무한 루프 방지 (증가 - 복잡한 스택 구조 고려)
    
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
          } catch {
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
            // 더 스마트한 이동 허용 로직
            const isMovingDown = newY < currentPosition.y - 0.001
            const isMovingUp = newY > currentPosition.y + 0.001
            const upwardDistance = newY - currentPosition.y
            
            let shouldMove = false
            let moveReason = ""
            
            if (isMovingDown) {
              // 아래로 이동은 항상 허용 (떨어지는 것)
              shouldMove = true
              moveReason = "falling down"
            } else if (isMovingUp && upwardDistance < 0.5) {
              // 위로 이동은 0.5 이하의 작은 거리만 허용 (새로운 지지대 위로)
              shouldMove = true
              moveReason = "small upward adjustment"
            } else if (isMovingUp) {
              // 큰 위로 이동은 거부
              shouldMove = false
              moveReason = "large upward movement blocked"
            }
            
            if (shouldMove) {
              model.setPosition({
                x: currentPosition.x,
                y: newY,
                z: currentPosition.z
              })
              
              hasChanges = true // 변경이 있었음을 표시
              console.log(`  -> ✅ Model ${model.getId()} repositioned from Y:${currentPosition.y.toFixed(3)} to Y:${newY.toFixed(3)} (${moveReason})`)
            } else {
              console.log(`  -> ⚠️ Model ${model.getId()} movement blocked: ${moveReason} (from ${currentPosition.y.toFixed(3)} to ${newY.toFixed(3)})`)
            }
          } else {
            console.log(`  -> ⏸️ Model ${model.getId()} position unchanged (difference: ${Math.abs(currentPosition.y - newY).toFixed(3)})`)
          }
        } catch {
          console.log(`  -> ⚠️ Cannot calculate surface Y for model ${model.getId()}: Attempting fallback to floor`)
          // 표면 계산 실패 시 바닥으로 떨어뜨리기 (지지를 잃었을 가능성)
          try {
            const floorY = this.calculateModelFloorY(model)
            if (Math.abs(currentPosition.y - floorY) > 0.01) {
              model.setPosition({
                x: currentPosition.x,
                y: floorY,
                z: currentPosition.z
              })
              hasChanges = true
              console.log(`  -> 🆘 Model ${model.getId()} fallen to floor Y: ${floorY.toFixed(3)}`)
            }
          } catch (fallbackError) {
            console.log(`  -> ❌ Complete failure for model ${model.getId()}: ${fallbackError}`)
            // 마지막 수단: Y=0 위에 배치
            const modelBottomOffset = this.getModelBottomOffset(model)
            const emergencyY = 0 - modelBottomOffset
            model.setPosition({
              x: currentPosition.x,
              y: emergencyY,
              z: currentPosition.z
            })
            hasChanges = true
            console.log(`  -> 🚨 Model ${model.getId()} emergency positioned at Y: ${emergencyY.toFixed(3)}`)
          }
        }
      }
      
      // 반복이 끝날 때마다 변경된 위치에 따라 모델 재정렬
      if (hasChanges) {
        modelsToRecalculate.sort((a, b) => {
          const aY = a.getPosition().y
          const bY = b.getPosition().y
          return aY - bY
        })
        console.log(`    -> Models re-sorted after iteration ${iterations}`)
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
    } catch {
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

  // 지지 품질을 계산하는 새로운 메서드
  private calculateSupportQuality(supportModel: BaseModel, targetModel: BaseModel, targetX: number, targetZ: number): number {
    const supportModelGroup = supportModel.getModel()
    const targetModelGroup = targetModel.getModel()
    
    if (!supportModelGroup || !targetModelGroup) return 0

    // 바운딩 박스 계산
    const supportBox = new THREE.Box3().setFromObject(supportModelGroup)
    const originalTargetPosition = targetModelGroup.position.clone()
    targetModelGroup.position.set(targetX, 0, targetZ)
    const targetBox = new THREE.Box3().setFromObject(targetModelGroup)
    targetModelGroup.position.copy(originalTargetPosition)
    
    // 겹침 계산
    const xOverlap = Math.min(targetBox.max.x, supportBox.max.x) - Math.max(targetBox.min.x, supportBox.min.x)
    const zOverlap = Math.min(targetBox.max.z, supportBox.max.z) - Math.max(targetBox.min.z, supportBox.min.z)
    
    if (xOverlap <= 0 || zOverlap <= 0) return 0
    
    const overlapArea = xOverlap * zOverlap
    const targetArea = (targetBox.max.x - targetBox.min.x) * (targetBox.max.z - targetBox.min.z)
    const supportArea = (supportBox.max.x - supportBox.min.x) * (supportBox.max.z - supportBox.min.z)
    
    // 품질 점수 계산 (0.0 ~ 1.0)
    const overlapRatio = overlapArea / targetArea
    const stabilityBonus = Math.min(supportArea / targetArea, 1.0) * 0.2 // 큰 지지대에 보너스
    
    return Math.min(overlapRatio + stabilityBonus, 1.0)
  }

  /**
   * 벽 변경 시 벽 가구를 선택적으로 재부착하는 메서드
   * 현재 위치에 벽이 여전히 있는 경우 위치를 유지하고,
   * 벽이 없어진 경우에만 가장 가까운 벽에 재부착시킵니다.
   */
  public repositionWallModelsAfterWallChange(): void {
    console.log('=== Starting conservative wall model repositioning after wall change ===')
    
    const wallModels = Array.from(this.models.values()).filter(model => 
      model.isModelLoaded() && model.getType() === 'wallcube'
    )
    
    if (wallModels.length === 0) {
      console.log('No wall models to reposition')
      return
    }

    console.log(`Found ${wallModels.length} wall models to check`)

    let repositionedCount = 0
    
    wallModels.forEach((model) => {
      const currentPosition = model.getPosition()
      console.log(`Checking wall model ${model.getId()} at position (${currentPosition.x.toFixed(3)}, ${currentPosition.y.toFixed(3)}, ${currentPosition.z.toFixed(3)})`)
      
      // WallCube 타입인지 확인
      if (model.getType() === 'wallcube') {
        try {
          const wallCube = model as WallCube // WallCube 타입으로 캐스팅
          
          // 현재 위치에서 벽이 여전히 유효한지 확인
          const isStillAttachedToWall = this.checkIfWallCubeHasValidWall(wallCube, currentPosition)
          
          if (isStillAttachedToWall) {
            // 현재 위치에 여전히 벽이 있으면 위치 유지
            console.log(`  -> ✅ Wall model ${model.getId()} still has valid wall, keeping current position`)
          } else {
            // 벽이 없어진 경우에만 재부착 시도
            console.log(`  -> Wall model ${model.getId()} no longer has valid wall, attempting reattachment`)
            
            const attached = wallCube.attachToWall(this.scene, currentPosition.x, currentPosition.z)
            
            if (attached) {
              repositionedCount++
              console.log(`  -> ✅ Wall model ${model.getId()} successfully reattached to new wall`)
            } else {
              console.log(`  -> ⚠️ Wall model ${model.getId()} could not find any nearby wall`)
            }
          }
        } catch (error) {
          console.log(`  -> ❌ Failed to check/reattach wall model ${model.getId()}: ${error}`)
        }
      }
    })
    
    console.log(`=== Conservative wall model repositioning completed: ${repositionedCount} wall models repositioned ===`)
  }

  /**
   * 벽 큐브가 현재 위치에서 유효한 벽에 부착되어 있는지 확인하는 메서드
   */
  private checkIfWallCubeHasValidWall(wallCube: WallCube, position: { x: number, y: number, z: number }): boolean {
    try {
      // 현재 위치 주변에서 벽 메시를 찾아서 유효성 확인
      const wallMeshes: THREE.Mesh[] = []
      this.scene.traverse((child) => {
        if (child.userData.isWall && child instanceof THREE.Mesh) {
          wallMeshes.push(child)
        }
      })

      // 현재 위치에서 가장 가까운 벽까지의 거리 확인
      const searchRadius = 0.6 // 벽 부착 유효 거리
      
      for (const wallMesh of wallMeshes) {
        const wallPosition = wallMesh.position
        const distance = Math.sqrt(
          Math.pow(position.x - wallPosition.x, 2) + 
          Math.pow(position.z - wallPosition.z, 2)
        )
        
        if (distance <= searchRadius) {
          console.log(`    -> Found valid wall at distance ${distance.toFixed(3)}`)
          return true
        }
      }
      
      console.log(`    -> No valid wall found within radius ${searchRadius}`)
      return false
    } catch (error) {
      console.log(`    -> Error checking wall validity: ${error}`)
      return false
    }
  }

  /**
   * 바닥 변경 시 스마트한 모델 재배치
   * - 바닥이 여전히 있는 위치: 완전 보존 (collision 재계산 안함)
   * - 바닥이 사라진 위치만: 근처 바닥이나 가구 위로 이동 (collision 고려)
   */
  public repositionModelsAfterFloorChange(): void {
    console.log('=== Starting smart repositioning after floor change ===')
    
    const allModels = Array.from(this.models.values()).filter(model => 
      model.isModelLoaded() && model.getType() !== 'wallcube'
    )
    
    if (allModels.length === 0) {
      console.log('No models to check')
      return
    }

    console.log(`Found ${allModels.length} models to check`)

    if (!this.hasFloorMeshes()) {
      console.log('⚠️ No floor available after change - all models need repositioning to default')
      return
    }

    let movedCount = 0
    let preservedCount = 0
    
    allModels.forEach((model) => {
      const currentPosition = model.getPosition()
      console.log(`Checking model ${model.getId()} at position (${currentPosition.x.toFixed(3)}, ${currentPosition.y.toFixed(3)}, ${currentPosition.z.toFixed(3)})`)
      
      // 현재 위치에 바닥이 있는지 정확히 체크
      const hasFloor = this.hasFloorTileAt(currentPosition.x, currentPosition.z)
      
      if (!hasFloor) {
        // 바닥이 사라진 경우만: 근처 바닥이나 가구 위로 이동 (collision 고려)
        console.log(`  -> ⚠️ Model ${model.getId()} lost its floor - moving to nearest surface (floor or stacked)`)
        
        const nearestFloor = this.findNearestFloorTile(currentPosition.x, currentPosition.z)
        
        if (nearestFloor) {
          const adjustedPosition = this.clampToFloorWithBounds(model, nearestFloor.x, nearestFloor.z)
          
          try {
            // 바닥이 사라진 가구는 근처 바닥이나 가구 위로 이동 (collision 고려)
            const surfaceY = this.calculateSurfaceY(model, adjustedPosition.x, adjustedPosition.z)
            model.setPosition({
              x: adjustedPosition.x,
              y: surfaceY,
              z: adjustedPosition.z
            })
            movedCount++
            console.log(`  -> 🚚 Model ${model.getId()} moved to nearest surface at (${adjustedPosition.x.toFixed(3)}, ${surfaceY.toFixed(3)}, ${adjustedPosition.z.toFixed(3)}) - stacking considered`)
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          } catch (_error) {
            // 1차 대안: 단순 바닥 Y
            try {
              const floorY = this.calculateModelFloorY(model)
              model.setPosition({
                x: adjustedPosition.x,
                y: floorY,
                z: adjustedPosition.z
              })
              movedCount++
              console.log(`  -> 🆘 Model ${model.getId()} fallback to floor Y: ${floorY.toFixed(3)}`)
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (_fallbackError) {
              // 2차 대안: 비상 조치
              const modelBottomOffset = this.getModelBottomOffset(model)
              const emergencyY = 0 - modelBottomOffset
              model.setPosition({
                x: adjustedPosition.x,
                y: emergencyY,
                z: adjustedPosition.z
              })
              movedCount++
              console.log(`  -> 🚨 Model ${model.getId()} emergency positioned at Y: ${emergencyY.toFixed(3)}`)
            }
          }
        } else {
          console.log(`  -> ❌ No valid floor found for model ${model.getId()}`)
        }
      } else {
        // 바닥이 여전히 있는 경우: 절대 건드리지 않음 (쌓임 구조 보존)
        preservedCount++
        console.log(`  -> 🔒 Model ${model.getId()} has floor - position completely preserved`)
      }
    })
    
    console.log(`=== Smart repositioning completed ===`)
    console.log(`🔒 ${preservedCount} models preserved (floor still exists - no collision recalc)`)
    console.log(`🚚 ${movedCount} models moved to nearest surface (floor disappeared - stacking considered)`)
    console.log('✨ No collision recalculation for preserved models - existing stacking maintained')
  }
} 