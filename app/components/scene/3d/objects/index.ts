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

export class RoundTableModel extends SimpleGLBModel {
  constructor(position?: ModelPosition, scale?: ModelScale, rotation?: ModelRotation) {
    super(MODEL_CONFIGS.roundtable, position, scale, rotation)
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

export class CameraModel extends SimpleGLBModel {
  constructor(position?: ModelPosition, scale?: ModelScale, rotation?: ModelRotation) {
    super(MODEL_CONFIGS.camera, position, scale, rotation)
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

export class KittyRugModel extends SimpleGLBModel {
  constructor(position?: ModelPosition, scale?: ModelScale, rotation?: ModelRotation) {
    super(MODEL_CONFIGS.kittyrug, position, scale, rotation)
  }
}

// 모델 카테고리 타입 정의
export type ModelCategory = 'Chair' | 'Desk' | 'Lighting' | 'Others' | 'Storage' | 'Wall' | 'Rug'

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
  { id: 'Chair', name: 'Chair', icon: '🪑' },
  { id: 'Desk', name: 'Desk', icon: '🗄️' },
  { id: 'Storage', name: 'Storage', icon: '📦' },
  { id: 'Lighting', name: 'Lighting', icon: '💡' },
  { id: 'Others', name: 'Others', icon: '🎨' },
  { id: 'Rug', name: 'Rug', icon: '🟫' },
  { id: 'Wall', name: 'Wall', icon: '🎨' },
]

// 모든 모델 메타데이터 (중앙 관리)
export const allModels: ModelMetadata[] = [
  {
    id: 'chair',
    name: '의자',
    description: '의자 모델',
    icon: '🪑',
    category: 'Chair',
    modelClass: ChairModel
  },
  {
    id: 'stool',
    name: '스툴',
    description: '스툴 모델',
    icon: '🔲',
    category: 'Chair',
    modelClass: StoolModel
  },
  {
    id: 'desk',
    name: '책상',
    description: '책상 모델',
    icon: '🗄️',
    category: 'Desk',
    modelClass: DeskModel
  },
  {
    id: 'roundtable',
    name: '원형 테이블',
    description: '책상 모델',
    icon: '🗄️',
    category: 'Desk',
    modelClass: RoundTableModel
  },
  {
    id: 'floorlamp',
    name: '플로어 램프',
    description: '바닥 조명 모델',
    icon: '💡',
    category: 'Lighting',
    modelClass: FloorLampModel
  },
  {
    id: 'book',
    name: '책',
    description: '이미지와 두께를 설정할 수 있는 책',
    icon: '📚',
    category: 'Others',
    modelClass: Book
  },
  {
    id: 'guitar',
    name: '기타',
    description: '데코레이션용 기타 모델',
    icon: '🎸',
    category: 'Others',
    modelClass: GuitarModel
  },
  {
    id: 'synthesizer',
    name: '신디사이저',
    description: '데코레이션용 신디사이저 모델',
    icon: '🎹',
    category: 'Others',
    modelClass: SynthesizerModel
  },
  {
    id: 'camera',
    name: '카메라',
    description: '데코레이션용 카메라 모델',
    icon: '📷',
    category: 'Others',
    modelClass: CameraModel
  },
  {
    id: 'woodchair',
    name: '나무 의자',
    description: '나무 재질의 의자 모델',
    icon: '🪑',
    category: 'Chair',
    modelClass: WoodChairModel
  },
  {
    id: 'blackstool',
    name: '검정 스툴',
    description: '검정색 스툴 모델',
    icon: '🔲',
    category: 'Chair',
    modelClass: BlackStoolModel
  },
  {
    id: 'sofa',
    name: '소파',
    description: '소파 모델',
    icon: '🛋️',
    category: 'Chair',
    modelClass: SofaModel
  },
  {
    id: 'tv',
    name: 'TV',
    description: '데코레이션용 TV 모델',
    icon: '📺',
    category: 'Others',
    modelClass: TVModel
  },
  {
    id: 'cardboard',
    name: 'Cardboard',
    description: '벽에 부착되는 카드보드 박스',
    icon: '📦',
    category: 'Wall',
    modelClass: CardboardModel
  },
  {
    id: 'kittyrug',
    name: '키티 러그',
    description: '귀여운 고양이 무늬 러그',
    icon: '🐱',
    category: 'Rug',
    modelClass: KittyRugModel
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