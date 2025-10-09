import { BaseModel, ModelPosition, ModelScale, ModelRotation } from './BaseModel'
import * as THREE from 'three'

export class StoolModel extends BaseModel {
  private rotationTime: number = 0

  constructor(
    position: ModelPosition = { x: 0, y: 0, z: 0 },
    scale: ModelScale = { x: 1.5, y: 1.5, z: 1.5 },
    rotation: ModelRotation = { x: 0, y: 0, z: 0 }
  ) {
    super('/3d/main/models/stool.glb', position, scale, rotation)
  }

  protected setupModel(): void {
    // 스툴의 실제 바운딩박스 계산
    if (this.model) {
      const boundingBox = new THREE.Box3().setFromObject(this.model)
      const height = boundingBox.max.y - boundingBox.min.y
      const offsetY = boundingBox.min.y - this.model.position.y
      
      // 고정된 반지름 0.482를 사용하는 원기둥 바운딩박스 설정
      this.setCustomBoundingBox({
        type: 'cylinder',
        radius: 0.482,
        height: height,
        offsetY: offsetY
      })
    }
  }

  public update(): void {
    // 좌우 왕복 회전 애니메이션 (180도씩)
    this.rotationTime += 0.01
    if (this.model) {
      // Math.sin을 사용해서 -1에서 1 사이 값을 얻고, Math.PI를 곱해서 -180도에서 180도 사이로 변환
      this.model.rotation.y = Math.sin(this.rotationTime) * Math.PI/2
      
      // 회전 후 매트릭스 업데이트 (바운딩 박스 계산이 정확하도록)
      this.model.updateMatrixWorld(true)
    }
  }

  public getType(): string {
    return 'stool'
  }

  protected applyTransforms(): void {
    super.applyTransforms()
    this.setupModel()
  }
} 