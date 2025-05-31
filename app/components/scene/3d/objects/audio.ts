import * as THREE from 'three'
import { BaseModel, ModelPosition, ModelScale, ModelRotation } from './BaseModel'

export class AudioModel extends BaseModel {
  private rotationTime: number = 0

  constructor(
    position: ModelPosition = { x: 0, y: 0, z: 0 },
    scale: ModelScale = { x: 2, y: 2, z: 2 },
    rotation: ModelRotation = { x: 0, y: 0, z: 0 }
  ) {
    super('/3d/main/models/audio.glb', position, scale, rotation)
  }

  protected setupModel(): void {
    // 추가적인 모델 설정이 필요한 경우 여기에 구현
    console.log('Audio model setup completed')
  }

  public update(): void {
    // 회전 애니메이션
    this.rotationTime += 0.01
    if (this.model) {
      this.model.rotation.y = this.rotationTime
    }
  }

  protected applyTransforms(): void {
    super.applyTransforms()
    this.setupModel()
  }
}

// 모델 메타데이터 export
export const modelMetadata = {
  id: 'audio',
  name: '오디오 시스템',
  description: '회전하는 오디오 스피커 모델',
  icon: '🔊',
  modelClass: AudioModel
} 