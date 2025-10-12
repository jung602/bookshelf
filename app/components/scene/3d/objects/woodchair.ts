import { BaseModel, ModelPosition, ModelScale, ModelRotation } from './BaseModel'
import * as THREE from 'three'

export class WoodChairModel extends BaseModel {
  private rotationTime: number = 0

  constructor(
    position: ModelPosition = { x: 0, y: 0, z: 0 },
    scale: ModelScale = { x: 1.8, y: 1.8, z: 1.8 },
    rotation: ModelRotation = { x: 0, y: -Math.PI/2, z: 0 }
  ) {
    super('/3d/main/models/woodchair.glb', position, scale, rotation)
  }

  protected setupModel(): void {
    // 나무 의자의 실제 바운딩박스 계산
    if (this.model) {
      const boundingBox = new THREE.Box3().setFromObject(this.model)
      const width = boundingBox.max.x - boundingBox.min.x
      const height = boundingBox.max.y - boundingBox.min.y
      const depth = boundingBox.max.z - boundingBox.min.z
      const offsetY = boundingBox.min.y - this.model.position.y
      
      // 박스 바운딩박스 설정
      this.setCustomBoundingBox({
        type: 'box',
        width: width,
        height: height,
        depth: depth,
        offsetY: offsetY
      })
    }
  }

  public update(): void {
  }

  public getType(): string {
    return 'woodchair'
  }

  protected applyTransforms(): void {
    super.applyTransforms()
    this.setupModel()
  }
}

