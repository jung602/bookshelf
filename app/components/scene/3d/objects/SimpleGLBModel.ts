import * as THREE from 'three'
import { BaseModel, ModelPosition, ModelScale, ModelRotation } from './BaseModel'
import { setupBoxBoundingBox, setupCylinderBoundingBox } from '../managers/visualization/BoundingBoxUtils'

/**
 * 간단한 GLB 모델을 위한 설정 인터페이스
 */
export interface SimpleModelConfig {
  modelPath: string
  typeName: string
  defaultScale?: ModelScale
  defaultRotation?: ModelRotation
  boundingBoxType: 'box' | 'cylinder-dynamic' | 'cylinder-fixed'
  cylinderRadius?: number
  updateFn?: (model: BaseModel, rotationTime: number) => void
}

/**
 * 설정 기반 단순 GLB 모델 클래스
 * 대부분의 가구 모델에 사용됩니다.
 */
export class SimpleGLBModel extends BaseModel {
  private config: SimpleModelConfig
  private rotationTime: number = 0

  constructor(
    config: SimpleModelConfig,
    position?: ModelPosition,
    scale?: ModelScale,
    rotation?: ModelRotation
  ) {
    super(
      config.modelPath,
      position || { x: 0, y: 0, z: 0 },
      scale || config.defaultScale || { x: 1, y: 1, z: 1 },
      rotation || config.defaultRotation || { x: 0, y: 0, z: 0 }
    )
    this.config = config
  }

  protected setupModel(): void {
    if (!this.model) return

    switch (this.config.boundingBoxType) {
      case 'box':
        setupBoxBoundingBox(this)
        break

      case 'cylinder-dynamic':
        setupCylinderBoundingBox(this, 'dynamic')
        break

      case 'cylinder-fixed':
        if (this.config.cylinderRadius !== undefined) {
          setupCylinderBoundingBox(this, this.config.cylinderRadius)
        } else {
          console.warn(`cylinder-fixed requires cylinderRadius for ${this.config.typeName}`)
          setupBoxBoundingBox(this)
        }
        break
    }
  }

  public update(): void {
    if (this.config.updateFn) {
      this.config.updateFn(this, this.rotationTime)
      this.rotationTime += 0.01
    }
  }

  public getType(): string {
    return this.config.typeName
  }

  protected applyTransforms(): void {
    super.applyTransforms()
    this.setupModel()
  }
}

/**
 * 모델 설정 레지스트리
 * 각 모델의 세부 설정을 중앙에서 관리합니다.
 */
export const MODEL_CONFIGS: Record<string, SimpleModelConfig> = {
  chair: {
    modelPath: '/3d/main/models/chair.glb',
    typeName: 'chair',
    defaultScale: { x: 1.5, y: 1.5, z: 1.5 },
    defaultRotation: { x: 0, y: -Math.PI / 2, z: 0 },
    boundingBoxType: 'box'
  },
  desk: {
    modelPath: '/3d/main/models/desk.glb',
    typeName: 'desk',
    defaultScale: { x: 1.5, y: 1.5, z: 1.5 },
    boundingBoxType: 'box'
  },
  stool: {
    modelPath: '/3d/main/models/stool.glb',
    typeName: 'stool',
    defaultScale: { x: 1.5, y: 1.5, z: 1.5 },
    boundingBoxType: 'cylinder-fixed',
    cylinderRadius: 0.482,
    updateFn: (model, rotationTime) => {
      const m = model.getModel()
      if (m) {
        m.rotation.y = Math.sin(rotationTime) * Math.PI / 2
        m.updateMatrixWorld(true)
      }
    }
  },
  blackstool: {
    modelPath: '/3d/main/models/blackstool.glb',
    typeName: 'blackstool',
    defaultScale: { x: 1.5, y: 1.5, z: 1.5 },
    boundingBoxType: 'box'
  },
  woodchair: {
    modelPath: '/3d/main/models/woodchair.glb',
    typeName: 'woodchair',
    defaultScale: { x: 1.8, y: 1.8, z: 1.8 },
    defaultRotation: { x: 0, y: -Math.PI / 2, z: 0 },
    boundingBoxType: 'box'
  },
  sofa: {
    modelPath: '/3d/main/models/sofa.glb',
    typeName: 'sofa',
    defaultScale: { x: 1.5, y: 1.5, z: 1.5 },
    defaultRotation: { x: 0, y: -Math.PI / 2, z: 0 },
    boundingBoxType: 'box'
  },
  guitar: {
    modelPath: '/3d/main/models/guitar.glb',
    typeName: 'guitar',
    defaultScale: { x: 1.7, y: 1.7, z: 1.7 },
    boundingBoxType: 'box'
  },
  tv: {
    modelPath: '/3d/main/models/tv.glb',
    typeName: 'tv',
    defaultScale: { x: 1.5, y: 1.5, z: 1.5 },
    boundingBoxType: 'box'
  },
  cardboard: {
    modelPath: '/3d/main/models/cardboard.glb',
    typeName: 'wall', // 중요: 벽 가구로 분류
    defaultScale: { x: 2.5, y: 2.5, z: 2.5 },
    boundingBoxType: 'box'
  }
}

/**
 * 모델 생성 팩토리 함수
 */
export function createSimpleModel(
  modelId: string,
  position?: ModelPosition,
  scale?: ModelScale,
  rotation?: ModelRotation
): SimpleGLBModel {
  const config = MODEL_CONFIGS[modelId]
  if (!config) {
    throw new Error(`Unknown model ID: ${modelId}`)
  }
  return new SimpleGLBModel(config, position, scale, rotation)
}

