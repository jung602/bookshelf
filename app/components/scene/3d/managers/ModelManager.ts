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
      model.removeFromScene(this.scene)
      model.dispose()
      this.models.delete(modelId)
      console.log(`Model ${modelId} removed from scene`)
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

    // Y 위치는 바닥 위로 유지 (모델의 바운딩 박스 고려)
    const modelY = this.calculateModelFloorY(model)
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

    // 임시로 모델을 원점에 배치해서 정확한 바운딩 박스 계산
    const originalPosition = threeModel.position.clone()
    threeModel.position.set(0, 0, 0)
    
    // 모델의 바운딩 박스 계산
    const box = new THREE.Box3().setFromObject(threeModel)
    
    // 원래 위치로 복원
    threeModel.position.copy(originalPosition)
    
    // 모델의 하단이 바닥에 닿도록 Y 위치 계산
    const modelBottomY = box.min.y
    return this.floorBounds.floorY - modelBottomY
  }

  private positionModelOnFloor(model: BaseModel): void {
    const position = model.getPosition()
    
    // 모델의 바운딩 박스를 고려한 경계 체크
    const clampedPosition = this.clampToFloorWithBounds(model, position.x, position.z)
    
    // Y 좌표는 바닥 위에 배치 (모델의 바운딩 박스 고려)
    const modelY = this.calculateModelFloorY(model)
    
    model.setPosition({
      x: clampedPosition.x,
      y: modelY,
      z: clampedPosition.z
    })

    console.log(`Model positioned on floor at (${clampedPosition.x}, ${modelY}, ${clampedPosition.z})`)
  }

  // 모델의 바운딩 박스를 고려한 경계 체크
  private clampToFloorWithBounds(model: BaseModel, x: number, z: number): { x: number, z: number } {
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
} 