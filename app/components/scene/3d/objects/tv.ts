import { BaseModel, ModelPosition, ModelScale, ModelRotation } from './BaseModel'
import * as THREE from 'three'

export class TVModel extends BaseModel {
  constructor(
    position: ModelPosition = { x: 0, y: 0, z: 0 },
    scale: ModelScale = { x: 1.5, y: 1.5, z: 1.5 },
    rotation: ModelRotation = { x: 0, y: 0, z: 0 }
  ) {
    super('/3d/main/models/tv.glb', position, scale, rotation)
  }

  protected setupModel(): void {
    // TV의 실제 바운딩박스 계산
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
    // TV는 정적 데코레이션이므로 업데이트 로직 불필요
  }

  public getType(): string {
    return 'tv'
  }

  protected applyTransforms(): void {
    super.applyTransforms()
    this.setupModel()
  }
}




