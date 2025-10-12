import { BaseModel, ModelPosition, ModelScale, ModelRotation } from './BaseModel'
import * as THREE from 'three'

export class BlackStoolModel extends BaseModel {
  private rotationTime: number = 0

  constructor(
    position: ModelPosition = { x: 0, y: 0, z: 0 },
    scale: ModelScale = { x: 1.5, y: 1.5, z: 1.5 },
    rotation: ModelRotation = { x: 0, y: 0, z: 0 }
  ) {
    super('/3d/main/models/blackstool.glb', position, scale, rotation)
  }

  protected setupModel(): void {
    // 검정 스툴의 실제 바운딩박스 계산 (chair와 동일한 박스 콜라이더)
    if (this.model) {
      const boundingBox = new THREE.Box3().setFromObject(this.model)
      const width = boundingBox.max.x - boundingBox.min.x
      const height = boundingBox.max.y - boundingBox.min.y
      const depth = boundingBox.max.z - boundingBox.min.z
      const offsetY = boundingBox.min.y - this.model.position.y
      
      // 박스 바운딩박스 설정 (chair와 동일)
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
    return 'blackstool'
  }

  protected applyTransforms(): void {
    super.applyTransforms()
    this.setupModel()
  }
}


