// 모든 모델 클래스 import
import { Book } from './book'
import { FloorLampModel } from './floorlamp'
import { SimpleGLBModel, MODEL_CONFIGS} from './SimpleGLBModel'
import { ModelPosition, ModelScale, ModelRotation } from './BaseModel'

// 레거시 호환성을 위한 클래스 래퍼
export class StoolModel extends SimpleGLBModel {
  constructor(position?: ModelPosition, scale?: ModelScale, rotation?: ModelRotation) {
    super(MODEL_CONFIGS.stool, position, scale, rotation)
  }
}

export class ChairModel extends SimpleGLBModel {
  constructor(position?: ModelPosition, scale?: ModelScale, rotation?: ModelRotation) {
    super(MODEL_CONFIGS.chair, position, scale, rotation)
  }
}

export class DeskModel extends SimpleGLBModel {
  constructor(position?: ModelPosition, scale?: ModelScale, rotation?: ModelRotation) {
    super(MODEL_CONFIGS.desk, position, scale, rotation)
  }
}

export class GuitarModel extends SimpleGLBModel {
  constructor(position?: ModelPosition, scale?: ModelScale, rotation?: ModelRotation) {
    super(MODEL_CONFIGS.guitar, position, scale, rotation)
  }
}

export class SynthesizerModel extends SimpleGLBModel {
  constructor(position?: ModelPosition, scale?: ModelScale, rotation?: ModelRotation) {
    super(MODEL_CONFIGS.synthesizer, position, scale, rotation)
  }
}

export class WoodChairModel extends SimpleGLBModel {
  constructor(position?: ModelPosition, scale?: ModelScale, rotation?: ModelRotation) {
    super(MODEL_CONFIGS.woodchair, position, scale, rotation)
  }
}

export class BlackStoolModel extends SimpleGLBModel {
  constructor(position?: ModelPosition, scale?: ModelScale, rotation?: ModelRotation) {
    super(MODEL_CONFIGS.blackstool, position, scale, rotation)
  }
}

export class SofaModel extends SimpleGLBModel {
  constructor(position?: ModelPosition, scale?: ModelScale, rotation?: ModelRotation) {
    super(MODEL_CONFIGS.sofa, position, scale, rotation)
  }
}

export class TVModel extends SimpleGLBModel {
  constructor(position?: ModelPosition, scale?: ModelScale, rotation?: ModelRotation) {
    super(MODEL_CONFIGS.tv, position, scale, rotation)
  }
}

export class CardboardModel extends SimpleGLBModel {
  constructor(position?: ModelPosition, scale?: ModelScale, rotation?: ModelRotation) {
    super(MODEL_CONFIGS.cardboard, position, scale, rotation)
  }
}

// 모델 카테고리 타입 정의
export type ModelCategory = 'chairs' | 'desks' | 'lighting' | 'decoration' | 'storage' | 'etc' | 'wall'

// 카테고리 메타데이터 인터페이스
export interface CategoryMetadata {
  id: ModelCategory
  name: string
  icon: string
}

// 모델 메타데이터 타입 정의
export interface ModelMetadata {
  id: string
  name: string
  description: string
  icon: string
  category: ModelCategory
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  modelClass: any
}

// 카테고리 정의
export const categories: CategoryMetadata[] = [
  { id: 'chairs', name: 'Chair', icon: '🪑' },
  { id: 'desks', name: 'Desk', icon: '🗄️' },
  { id: 'storage', name: 'Storage', icon: '📦' },
  { id: 'etc', name: 'Furniture', icon: '📦' },
  { id: 'lighting', name: 'Lighting', icon: '💡' },
  { id: 'decoration', name: 'Decoration', icon: '🎨' },
  { id: 'wall', name: 'Wall', icon: '🎨' },
]

// 모든 모델 메타데이터 (중앙 관리)
export const allModels: ModelMetadata[] = [
  {
    id: 'chair',
    name: '의자',
    description: '의자 모델',
    icon: '🪑',
    category: 'chairs',
    modelClass: ChairModel
  },
  {
    id: 'stool',
    name: '스툴',
    description: '스툴 모델',
    icon: '🔲',
    category: 'chairs',
    modelClass: StoolModel
  },
  {
    id: 'desk',
    name: '책상',
    description: '책상 모델',
    icon: '🗄️',
    category: 'desks',
    modelClass: DeskModel
  },
  {
    id: 'floorlamp',
    name: '플로어 램프',
    description: '바닥 조명 모델',
    icon: '💡',
    category: 'lighting',
    modelClass: FloorLampModel
  },
  {
    id: 'book',
    name: '책',
    description: '이미지와 두께를 설정할 수 있는 책',
    icon: '📚',
    category: 'decoration',
    modelClass: Book
  },
  {
    id: 'guitar',
    name: '기타',
    description: '데코레이션용 기타 모델',
    icon: '🎸',
    category: 'decoration',
    modelClass: GuitarModel
  },
  {
    id: 'synthesizer',
    name: '신디사이저',
    description: '데코레이션용 신디사이저 모델',
    icon: '🎹',
    category: 'decoration',
    modelClass: SynthesizerModel
  },
  {
    id: 'woodchair',
    name: '나무 의자',
    description: '나무 재질의 의자 모델',
    icon: '🪑',
    category: 'chairs',
    modelClass: WoodChairModel
  },
  {
    id: 'blackstool',
    name: '검정 스툴',
    description: '검정색 스툴 모델',
    icon: '🔲',
    category: 'chairs',
    modelClass: BlackStoolModel
  },
  {
    id: 'sofa',
    name: '소파',
    description: '소파 모델',
    icon: '🛋️',
    category: 'chairs',
    modelClass: SofaModel
  },
  {
    id: 'tv',
    name: 'TV',
    description: '데코레이션용 TV 모델',
    icon: '📺',
    category: 'decoration',
    modelClass: TVModel
  },
  {
    id: 'cardboard',
    name: '카드보드 박스',
    description: '벽에 부착되는 카드보드 박스',
    icon: '📦',
    category: 'wall',
    modelClass: CardboardModel
  }
]

// 모델 ID로 모델 클래스를 찾는 함수
export function getModelClass(modelId: string) {
  const modelMetadata = allModels.find(model => model.id === modelId)
  return modelMetadata?.modelClass || null
}

// UI에서 사용할 모델 리스트 (ModelClass 제외)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const availableModels = allModels.map(({ modelClass, ...rest }) => rest)

// SimpleGLBModel 시스템 export
export { SimpleGLBModel, MODEL_CONFIGS, createSimpleModel } from './SimpleGLBModel'
export type { SimpleModelConfig } from './SimpleGLBModel' 