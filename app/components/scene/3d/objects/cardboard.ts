import { BaseModel, ModelPosition, ModelScale, ModelRotation } from './BaseModel'
import * as THREE from 'three'

export class CardboardModel extends BaseModel {
  constructor(
    position: ModelPosition = { x: 0, y: 0, z: 0 },
    scale: ModelScale = { x: 2.5, y: 2.5, z: 2.5 },
    rotation: ModelRotation = { x: 0, y: 0, z: 0 }
  ) {
    super('/3d/main/models/cardboard.glb', position, scale, rotation)
  }

  protected setupModel(): void {
    // 카드보드 박스의 실제 바운딩박스 계산
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
    // 애니메이션 로직 (필요시 추가)
  }

  public getType(): string {
    return 'wall'  // 벽가구로 설정
  }

  protected applyTransforms(): void {
    super.applyTransforms()
    this.setupModel()
  }
}
