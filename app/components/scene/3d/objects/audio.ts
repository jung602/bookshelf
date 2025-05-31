import * as THREE from 'three'
import { loadGLBModel } from '../scenes/loadGLBModel'

export class AudioModel {
  private audioModel!: THREE.Group
  private rotationTime: number = 0

  constructor() {}

  public async load(): Promise<void> {
    try {
      // Next.js basePath를 고려한 경로 설정
      const basePath = process.env.NODE_ENV === 'production' ? '/bookshelf' : ''
      this.audioModel = await loadGLBModel(`${basePath}/3d/main/models/audio.glb`)
      
      // 모델을 (0, 0, 0) 위치에 배치
      this.audioModel.position.set(0, .4, 0)
      
      // 모델 크기 조정 (필요에 따라)
      this.audioModel.scale.set(2, 2, 2)

      this.audioModel.rotation.set(0, Math.PI, 0)
      
      console.log('Audio model loaded successfully at position (0, 0, 0)')
    } catch (error) {
      console.error('Failed to load audio model:', error)
      throw error
    }
  }

  public addToScene(scene: THREE.Scene): void {
    if (this.audioModel) {
      scene.add(this.audioModel)
    }
  }

  public update(): void {
    // 오디오 모델 회전 애니메이션
    if (this.audioModel) {
      this.rotationTime += 0.01
      // ease-in-out 함수를 사용한 좌우 90도 회전
      const easeInOut = (t: number) => t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t
      const normalizedTime = (Math.sin(this.rotationTime) + 1) / 2 // 0~1 사이 값
      const easedTime = easeInOut(normalizedTime)
      const rotationAngle = Math.PI + (easedTime - 0.5) * Math.PI / 2 // 기본 180도에서 ±45도 회전
      this.audioModel.rotation.y = rotationAngle
    }
  }

  public getModel(): THREE.Group | undefined {
    return this.audioModel
  }

  public dispose(): void {
    if (this.audioModel) {
      this.audioModel.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose()
          if (object.material instanceof THREE.Material) {
            object.material.dispose()
          }
        }
      })
    }
  }
} 