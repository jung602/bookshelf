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


  // 통합 모델 추가 메소드 - 벽/바닥 구분하여 처리
  public async addModel(model: BaseModel): Promise<void>
  public async addModel(modelType: string, ModelClass: unknown, position?: { x: number; y: number; z: number }): Promise<string | null>
  public async addModel(modelOrType: BaseModel | string, ModelClass?: unknown, position?: { x: number; y: number; z: number }): Promise<string | null | void> {
    // 기존 방식 (BaseModel 인스턴스 전달)
    if (typeof modelOrType !== 'string') {
      const model = modelOrType as BaseModel
      
      if (model.getType() === 'wallcube') {
        // 벽 가구는 WallModelManager에서 처리 (스마트 배치)
        const modelId = await this.wallManager.addWallModel(model)
        return
      } else {
        // 바닥 가구는 FloorModelManager에서 처리 (스마트 배치)
        const modelId = await this.floorManager.addFloorModel(model)
        return
      }
    }
    
    // 새로운 방식 (modelType과 ModelClass 전달)
    const modelType = modelOrType as string
    const model = new (ModelClass as new (position?: { x: number; y: number; z: number }) => BaseModel)(position)
    
    if (model.getType() === 'wallcube') {
      // 벽 가구인 경우 - WallModelManager에 위임 (스마트 배치 활성화)
      const modelId = await this.wallManager.addWallModel(model, {
        position,
        useOptimalPlacement: true  // 스마트 배치 활성화
      })
      return modelId
    } else {
      // 바닥 가구인 경우 - FloorModelManager에 위임 (위치 지정 배치)
      const modelId = await this.floorManager.addFloorModel(model, {
        position,
        useOptimalPlacement: false
      })
      return modelId
    }
  }

  public async removeModel(modelId: string): Promise<void> {
    const model = this.models.get(modelId)
    if (model) {
      // 삭제 전에 모델 위치 저장
      const removedPosition = model.getPosition()
      
      console.log(`[ModelManager] Removing ${model.getType()} at (${removedPosition.x.toFixed(2)}, ${removedPosition.y.toFixed(2)}, ${removedPosition.z.toFixed(2)})`)
      
      // 삭제 전 모든 모델 상태 출력
      this.logAllModelStates()
      
      // 벽 가구인 경우 사용 횟수 감소
      if (model.getType() === 'wallcube') {
        this.wallManager.onWallModelRemoved(model)
      }
      
      // 삭제될 모델 위에 있는 모델들을 찾기
      const affectedModels = this.floorManager.findModelsAffectedByRemoval(modelId)
      console.log(`[ModelManager] Found ${affectedModels.length} affected models:`, affectedModels)

      model.removeFromScene(this.scene)
      model.dispose()
      this.models.delete(modelId)
      
      // 영향받는 모델들만 선택적으로 재계산
      if (affectedModels.length > 0) {
        console.log(`[ModelManager] Starting recalculation for affected models`)
        await this.floorManager.recalculateAffectedModelPositions(affectedModels, removedPosition)
        console.log(`[ModelManager] Recalculation completed`)
      } else {
        console.log(`[ModelManager] No affected models found`)
        
        // 폴백: 삭제된 모델이 바닥 가구이고 다른 모델들이 있다면 모든 모델 재검증
        if (model.getType() !== 'wallcube') {
          const allFloorModels = Array.from(this.models.values()).filter(m => m.getType() !== 'wallcube')
          if (allFloorModels.length > 0) {
            console.log(`[ModelManager] Performing fallback recalculation for all ${allFloorModels.length} floor models`)
            const allModelIds = allFloorModels.map(m => m.getId())
            await this.floorManager.recalculateAffectedModelPositions(allModelIds, removedPosition)
          }
        }
      }
    }
  }

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

  // 디버깅용: 모든 모델 상태 출력
  public logAllModelStates(): void {
    console.log('=== ALL MODEL STATES ===')
    this.models.forEach((model, id) => {
      const pos = model.getPosition()
      console.log(`${model.getType()} (${id}): (${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)})`)
    })
    console.log('========================')
  }

  public rotateModel(modelId: string): void {
    const model = this.models.get(modelId)
    if (model) {
      if (model.getType() === 'wallcube') {
        // 벽 가구 회전은 WallModelManager에 위임
        this.wallManager.rotateWallModel(modelId)
      } else {
        // 바닥 가구 회전은 FloorModelManager에 위임
        this.floorManager.rotateFloorModel(modelId)
      }
    }
  }



  // 모델 이동 메서드 (벽/바닥 가구 구분)
  public moveModel(modelId: string, x: number, z: number, y?: number): void {
    const model = this.models.get(modelId)
    if (!model) return

    // 벽 가구인지 확인
    if (model.getType() === 'wallcube') {
      // 벽 가구 이동은 WallModelManager에 위임
      this.wallManager.moveWallModel(modelId, x, z, y)
    } else {
      // 바닥 가구 이동은 FloorModelManager에 위임
      this.floorManager.moveFloorModel(modelId, x, z)
    }
  }

  // 드래그 후 다른 모델들 재계산 (InteractionManager에서 호출)
  public async recalculateOtherModelPositions(excludeModelId: string, previousPosition?: { x: number, y: number, z: number }): Promise<void> {
    return this.floorManager.recalculateOtherModelPositions(excludeModelId, previousPosition)
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







  public rebuildIndex(): void {
    this.sceneIndex.rebuild()
    // 인덱스 변경 후, 매니저들이 같은 인덱스를 참조하므로 별도 동기화 불필요
  }

  // 매니저 접근용 getter
  public getFloorManager(): FloorModelManager {
    return this.floorManager
  }

  public getWallManager(): WallModelManager {
    return this.wallManager
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