import { BaseModel, ModelPosition, ModelScale, ModelRotation } from './BaseModel'

export class DeskModel extends BaseModel {
  private rotationTime: number = 0

  constructor(
    position: ModelPosition = { x: 0, y: 0, z: 0 },
    scale: ModelScale = { x: 1.5, y: 1.5, z: 1.5 },
    rotation: ModelRotation = { x: 0, y: 0, z: 0 }
  ) {
    super('/3d/main/models/desk.glb', position, scale, rotation)
  }

  protected setupModel(): void {
    // 추가적인 모델 설정이 필요한 경우 여기에 구현
    console.log('Desk model setup completed')
  }

  public update(): void {
  }

  public getType(): string {
    return 'desk'
  }

  protected applyTransforms(): void {
    super.applyTransforms()
    this.setupModel()
  }
}

// 모델 메타데이터 export
export const modelMetadata = {
  id: 'desk',
  name: '책상',
  description: '책상 모델',
  icon: '🪑',
  modelClass: DeskModel
}