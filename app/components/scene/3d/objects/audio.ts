import * as THREE from 'three'
import { BaseModel, ModelPosition, ModelScale, ModelRotation } from './BaseModel'

export class AudioModel extends BaseModel {
  private rotationTime: number = 0

  constructor(
    position: ModelPosition = { x: 0, y: 0, z: 0 },
    scale: ModelScale = { x: 2, y: 2, z: 2 },
    rotation: ModelRotation = { x: 0, y: Math.PI, z: 0 }
  ) {
    super('/3d/main/models/audio.glb', position, scale, rotation)
  }

  protected setupModel(): void {
    // 추가적인 모델 설정이 필요한 경우 여기에 구현
    console.log('Audio model setup completed')
  }

  public update(): void {
    // 오디오 모델 회전 애니메이션
    if (this.model) {
      this.rotationTime += 0.01
      // ease-in-out 함수를 사용한 좌우 90도 회전
      const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      const normalizedTime = (Math.sin(this.rotationTime) + 1) / 2 // 0~1 사이 값
      const easedTime = easeInOut(normalizedTime)
      const rotationAngle = Math.PI + (easedTime - 0.5) * Math.PI / 2 // 기본 180도에서 ±45도 회전
      this.model.rotation.y = rotationAngle
    }
  }

  protected applyTransforms(): void {
    super.applyTransforms()
    this.setupModel()
  }
} 