import * as THREE from 'three'
import { BaseModel } from '../objects/BaseModel'
import { SceneIndex } from './SceneIndex'
import { BoundingBoxVisualizer } from './BoundingBoxVisualizer'
import { calculateBoundingBox } from './BoundingBoxUtils'

/**
 * FloorModelManager와 WallModelManager의 공통 기능을 제공하는 추상 베이스 클래스
 */
export abstract class BaseModelManager {
  protected scene: THREE.Scene
  protected models: Map<string, BaseModel>
  protected sceneIndex: SceneIndex
  protected raycaster: THREE.Raycaster
  protected visualizer: BoundingBoxVisualizer

  constructor(
    scene: THREE.Scene,
    models: Map<string, BaseModel>,
    sceneIndex: SceneIndex,
    visualizerColor: number
  ) {
    this.scene = scene
    this.models = models
    this.sceneIndex = sceneIndex
    this.raycaster = new THREE.Raycaster()
    this.visualizer = new BoundingBoxVisualizer(scene, models, visualizerColor)
  }

  // 공통 메서드 1: 바운딩박스 시각화
  public enableBoundingBoxVisualization(filterFn?: (model: BaseModel) => boolean): void {
    this.visualizer.enable(filterFn)
  }

  public disableBoundingBoxVisualization(): void {
    this.visualizer.disable()
  }

  public toggleBoundingBoxVisualization(filterFn?: (model: BaseModel) => boolean): boolean {
    this.visualizer.toggle(filterFn)
    return this.visualizer.isEnabled()
  }

  public updateModelBoundingBox(modelId: string): void {
    this.visualizer.updateModel(modelId)
  }

  public updateAllBoundingBoxHelpers(filterFn?: (model: BaseModel) => boolean): void {
    this.visualizer.updateAll(filterFn)
  }

  // 공통 메서드 2: 모델 바닥 오프셋 계산
  protected getModelBottomOffset(model: BaseModel): number {
    const customBB = model.getCustomBoundingBox()
    if (customBB && customBB.offsetY !== undefined) {
      return customBB.offsetY
    }

    const boundingBox = calculateBoundingBox(model)
    if (!boundingBox) return 0

    const position = model.getPosition()
    return boundingBox.min.y - position.y
  }

  // 공통 메서드 3: 바닥 높이 계산
  protected getFloorHeight(x: number, z: number): number {
    const rayOrigin = new THREE.Vector3(x, 100, z)
    const rayDirection = new THREE.Vector3(0, -1, 0)
    this.raycaster.set(rayOrigin, rayDirection)

    const floorMeshes = this.sceneIndex.getFloorMeshes()
    if (floorMeshes.length === 0) return 0

    const intersections = this.raycaster.intersectObjects(floorMeshes)
    if (intersections.length > 0) {
      return intersections[0].point.y
    }
    return 0
  }

  // 추상 메서드 (자식 클래스에서 구현)
  public abstract addModel(...args: unknown[]): Promise<string>
}

