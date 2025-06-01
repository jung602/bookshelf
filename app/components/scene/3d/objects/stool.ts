import { BaseModel, ModelPosition, ModelScale, ModelRotation } from './BaseModel'

export class StoolModel extends BaseModel {
  private rotationTime: number = 0

  constructor(
    position: ModelPosition = { x: 0, y: 0, z: 0 },
    scale: ModelScale = { x: 1.6, y: 1.6, z: 1.6 },
    rotation: ModelRotation = { x: 0, y: 0, z: 0 }
  ) {
    super('/3d/main/models/stool.glb', position, scale, rotation)
  }

  protected setupModel(): void {
    // 추가적인 모델 설정이 필요한 경우 여기에 구현
    console.log('Audio model setup completed')
  }

  public update(): void {
    // 좌우 왕복 회전 애니메이션 (180도씩)
    this.rotationTime += 0.01
    if (this.model) {
      // Math.sin을 사용해서 -1에서 1 사이 값을 얻고, Math.PI를 곱해서 -180도에서 180도 사이로 변환
      this.model.rotation.y = Math.sin(this.rotationTime) * Math.PI/2
    }
  }

  protected applyTransforms(): void {
    super.applyTransforms()
    this.setupModel()
  }
}

// 모델 메타데이터 export
export const modelMetadata = {
  id: 'stool',
  name: '스툴',
  description: '스툴 모델',
  icon: '🪑',
  modelClass: StoolModel
} 