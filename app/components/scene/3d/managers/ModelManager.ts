import * as THREE from 'three'
import { BaseModel } from '../objects/BaseModel'
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
      
      if (model.getType() === 'wall') {
        // 벽 가구는 WallModelManager에서 처리 (스마트 배치)
        await this.wallManager.addWallModel(model)
        return
      } else {
        // 바닥 가구는 FloorModelManager에서 처리 (스마트 배치)
        await this.floorManager.addFloorModel(model)
        return
      }
    }
    
    // 새로운 방식 (modelType과 ModelClass 전달)
    const model = new (ModelClass as new (position?: { x: number; y: number; z: number }) => BaseModel)(position)
    
    if (model.getType() === 'wallcube' || model.getType() === 'wall') {
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
      // 삭제될 모델 위에 있는 모델들을 찾기
      const affectedModels = this.floorManager.findModelsAffectedByRemoval(modelId)

      model.removeFromScene(this.scene)
      model.dispose()
      this.models.delete(modelId)
      
      // 영향받는 모델들만 선택적으로 재계산
      if (affectedModels.length > 0) {
        await this.floorManager.recalculateAffectedModelPositions(affectedModels)
      } else {
        // 폴백: 삭제된 모델이 바닥 가구이고 다른 모델들이 있다면 모든 모델 재검증
        if (model.getType() !== 'wall') {
          const allFloorModels = Array.from(this.models.values()).filter(m => m.getType() !== 'wall')
          if (allFloorModels.length > 0) {
            const allModelIds = allFloorModels.map(m => m.getId())
            await this.floorManager.recalculateAffectedModelPositions(allModelIds)
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

  // 드래그 후 다른 모델들 재계산 (InteractionManager에서 호출)
  public async recalculateOtherModelPositions(excludeModelId: string, previousPosition?: { x: number, y: number, z: number }): Promise<void> {
    return this.floorManager.recalculateOtherModelPositions(excludeModelId, previousPosition)
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

  // 바운딩박스 시각화 메서드들
  public toggleBoundingBoxVisualization(): void {
    this.floorManager.toggleBoundingBoxVisualization((model) => model.getType() !== 'wall')
    this.wallManager.toggleBoundingBoxVisualization((model) => model.getType() === 'wall')
  }

  public enableBoundingBoxVisualization(): void {
    this.floorManager.enableBoundingBoxVisualization((model) => model.getType() !== 'wall')
    this.wallManager.enableBoundingBoxVisualization((model) => model.getType() === 'wall')
  }

  public disableBoundingBoxVisualization(): void {
    this.floorManager.disableBoundingBoxVisualization()
    this.wallManager.disableBoundingBoxVisualization()
  }

  // 특정 모델의 바운딩박스 업데이트
  public updateModelBoundingBox(modelId: string): void {
    const model = this.models.get(modelId)
    if (!model) return

    if (model.getType() === 'wall') {
      this.wallManager.updateModelBoundingBox(modelId)
    } else {
      this.floorManager.updateModelBoundingBox(modelId)
    }
  }

  // 모든 바운딩박스 업데이트
  public updateAllBoundingBoxes(): void {
    this.floorManager.updateAllBoundingBoxHelpers((model) => model.getType() !== 'wall')
    this.wallManager.updateAllBoundingBoxHelpers((model) => model.getType() === 'wall')
  }
}