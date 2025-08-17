import * as THREE from 'three'
import { BaseModel } from '../objects/BaseModel'
import { WallCube } from '../objects/WallCube'
import { SceneIndex } from './SceneIndex'
import { FloorModelManager } from './FloorModelManager'
import { WallModelManager } from './WallModelManager'


export class ModelManager {
  private scene: THREE.Scene
  private models: Map<string, BaseModel> = new Map()
  private sceneIndex: SceneIndex
  private floorManager: FloorModelManager
  private wallManager: WallModelManager

  constructor(scene: THREE.Scene) {
    this.scene = scene
    this.sceneIndex = new SceneIndex(scene)
    this.floorManager = new FloorModelManager(this.scene, this.models, this.sceneIndex)
    this.wallManager = new WallModelManager(this.scene, this.models, this.sceneIndex)
  }

  // 실제 바닥 메시가 있는지 확인하는 메서드
  private hasFloorMeshes(): boolean {
    return this.floorManager.hasFloorMeshes()
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
        
        // 스마트 배치: 최적의 위치 찾기
        const optimalPosition = this.findOptimalPlacement(model)
        if (!optimalPosition) {
          model.dispose()
          throw new Error('바닥이 너무 좁아서 가구를 배치할 수 없습니다. 바닥을 넓히거나 다른 가구를 제거해주세요.')
        }
        
        // 최적 위치에 배치
        model.setPosition(optimalPosition)
        
        model.addToScene(this.scene)
        this.models.set(model.getId(), model)
        
    
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
  
        wallCube.dispose()
        return null
      }
      
      wallCube.addToScene(this.scene)
      this.models.set(wallCube.getId(), wallCube)
      
  
      return wallCube.getId()
    } catch (error) {
      console.error('Failed to add wall cube:', error)
      return null
    }
  }

  // 개선된 바닥 배치 검증 메서드 (현재 버전에서 가져옴)
  public canPlaceOnFloor(model: BaseModel, x: number, z: number): boolean {
    return this.floorManager.canPlaceOnFloor(model, x, z)
  }

  // 개선된 바닥 배치 메서드 (현재 버전에서 가져옴)
  public placeOnFloor(model: BaseModel, x: number, z: number): void {
    this.floorManager.placeOnFloor(model, x, z)
  }

  // 벽 가구 배치 가능 여부 확인 (기존 로직 유지)
  public canPlaceOnWall(model: BaseModel, x: number, z: number): boolean {
    return this.wallManager.canPlaceOnWall(model, x, z)
  }

  // 지정된 위치에 바닥이 있는지 확인
  private hasFloorAt(x: number, z: number): boolean {
    return this.floorManager.hasFloorAt(x, z)
  }

  // 가장 가까운 벽 찾기
  private findNearestWall(x: number, z: number): THREE.Mesh | null {
    return this.wallManager.findNearestWall(x, z)
  }

  // 모델이 벽보다 작은지 확인
  private isModelSmallerThanWall(model: BaseModel, wall: THREE.Mesh): boolean {
    return this.wallManager.isModelSmallerThanWall(model, wall)
  }

  // 기존 04a630c 커밋의 메서드들 유지하면서 개선사항 적용
  private calculateModelFloorY(model: BaseModel): number {
    // FloorModelManager로 위임
    const pos = model.getPosition()
    return this.floorManager.calculateModelFloorY(model, pos.x, pos.z)
  }

  public calculateSurfaceY(targetModel: BaseModel, x: number, z: number, excludeModelIds: string[] = []): number {
    return this.floorManager.calculateSurfaceY(targetModel, x, z, excludeModelIds)
  }

  // 개선된 모델 간 지지 관계 확인 (현재 버전 기반)
  private canModelSupportAnother(supportModel: BaseModel, targetModel: BaseModel, targetX: number, targetZ: number): boolean {
    return (this as any).floorManager['canModelSupportAnother'](supportModel, targetModel, targetX, targetZ)
  }

  // 개선된 모델 하단 오프셋 계산 (더 자세한 로깅)
  private getModelBottomOffset(model: BaseModel): number {
    // FloorModelManager와 로직 공유가 필요하지만, 외부 시그니처 유지 위해 기존 구현 유지
    const modelGroup = model.getModel()
    if (!modelGroup) return 0
    const boundingBox = new THREE.Box3().setFromObject(modelGroup)
    return boundingBox.min.y - modelGroup.position.y
  }

  // 바닥 높이 가져오기
  private getFloorHeight(x: number, z: number): number {
    const raycaster = new THREE.Raycaster()
    const rayOrigin = new THREE.Vector3(x, 1, z)
    const rayDirection = new THREE.Vector3(0, -1, 0)
    raycaster.set(rayOrigin, rayDirection)

    const floorMeshes: THREE.Mesh[] = this.sceneIndex.getFloorMeshes()
    const intersections = raycaster.intersectObjects(floorMeshes, false)
    return intersections.length > 0 ? intersections[0].point.y : 0
  }

  // 기존 04a630c 메서드들 유지
  public async removeModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId)
    if (model) {
      
      
      // 삭제 전에 모델 위치 저장
      const removedPosition = model.getPosition()
      
      // 삭제될 모델 위에 있는 모델들을 찾기
      const affectedModels = this.findModelsAffectedByRemoval(modelId)

      
      model.removeFromScene(this.scene)
      model.dispose()
      this.models.delete(modelId)
      

      
      // 영향받는 모델들만 선택적으로 재계산
      if (affectedModels.length > 0) {

        await this.recalculateAffectedModelPositions(affectedModels, removedPosition)
      } else {

      }
      

    } else {
      
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
      // 회전 후 재배치 및 충돌 안정화
      if (model.getType() !== 'wallcube') {
        const pos = model.getPosition()
        try {
          this.placeOnFloor(model, pos.x, pos.z)
        } catch {
          const clamped = this.clampToFloorWithBounds(model, pos.x, pos.z)
          const newY = this.calculateSurfaceY(model, clamped.x, clamped.z)
          model.setPosition({ x: clamped.x, y: newY, z: clamped.z })
        }
        // 다른 모델들 재계산
        this.recalculateOtherModelPositions(modelId)
      }
    }
  }

  // 벽 가구 이동 메서드
  private moveWallModel(modelId: string, x: number, z: number, y?: number): void {
    const model = this.models.get(modelId)
    if (!model || model.getType() !== 'wallcube') return

    // TODO: WallCube 클래스의 attachToWall 메서드 구현 필요

    
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
      
      return
    }

    const clampedPosition = this.clampToFloorWithBounds(model, x, z)
    const modelY = this.calculateSurfaceY(model, clampedPosition.x, clampedPosition.z)
    model.setPosition({
      x: clampedPosition.x,
      y: modelY,
      z: clampedPosition.z
    })


  }

  // 드래그 후 다른 모델들 재계산 (InteractionManager에서 호출)
  public async recalculateOtherModelPositions(excludeModelId: string): Promise<void> {
    return this.floorManager.recalculateOtherModelPositions(excludeModelId)
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



  // 스마트 배치: 최적의 위치 찾기 메서드
  private findOptimalPlacement(model: BaseModel): { x: number, y: number, z: number } | null {
    return this.floorManager.findOptimalPlacement(model)
  }

  // 우선순위 위치 생성: 중앙부터 시작해서 나선형으로 확장
  private generateSearchPositions(bounds: { minX: number, maxX: number, minZ: number, maxZ: number }): { x: number, z: number }[] {
    // Moved to FloorModelManager. Kept for legacy signature; unused here.
    return []
  }

  // 기존 모델들과의 충돌 확인
  private hasCollisionWithExistingModels(testModel: BaseModel, x: number, z: number): boolean {
    return (this as any).floorManager['hasCollisionWithExistingModels'](testModel, x, z)
  }

  // 기존 04a630c 커밋의 나머지 복잡한 로직들
  
  private findModelsAffectedByRemoval(removedModelId: string): string[] {
    const removedModel = this.models.get(removedModelId)
    if (!removedModel) return []

    const affectedModels: string[] = []
    const removedPosition = removedModel.getPosition()



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
    return this.floorManager.checkCollisionAndAdjust(targetModel, newX, newY, newZ)
  }

  // 헬퍼 메서드들

  public clampToFloorWithBounds(model: BaseModel, x: number, z: number): { x: number, z: number } {
    return this.floorManager.clampToBounds(model, x, z)
  }

  // 바닥의 전체 경계를 계산하는 헬퍼 메서드
  private getFloorBounds(): { minX: number, maxX: number, minZ: number, maxZ: number } | null {
    return this.sceneIndex.getFloorBounds()
  }

  public rebuildIndex(): void {
    this.sceneIndex.rebuild()
    // 인덱스 변경 후, 매니저들이 같은 인덱스를 참조하므로 별도 동기화 불필요
  }

  // 벽 부착(드래그 중 포함) 위임 메서드
  public attachToNearestWall(model: BaseModel, x: number, z: number, y?: number): boolean {
    return this.wallManager.attachToNearestWall(model, x, z, y)
  }

  // 바닥 변경 후 모델 재배치 공개 메서드
  public async repositionModelsAfterFloorChange(): Promise<string[]> {
    return await this.floorManager.repositionModelsAfterFloorChange()
  }

  // 벽 변경 후 벽 가구 재부착 공개 메서드
  public repositionWallModelsAfterWallChange(): string[] {
    return this.wallManager.repositionWallModelsAfterWallChange()
  }
}