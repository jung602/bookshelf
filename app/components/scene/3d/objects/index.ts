// 모든 모델 클래스 import
import { StoolModel } from './stool'
import { ChairModel } from './chair'
import { DeskModel } from './desk'
import { Book } from './book'
import { WallCube } from './WallCube'
import { FloorLampModel } from './floorlamp'

// 모델 카테고리 타입 정의
export type ModelCategory = 'chairs' | 'desks' | 'lighting' | 'decoration' | 'storage'

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
  { id: 'chairs', name: '의자', icon: '🪑' },
  { id: 'desks', name: '책상', icon: '🗄️' },
  { id: 'lighting', name: '조명', icon: '💡' },
  { id: 'decoration', name: '장식', icon: '🎨' },
  { id: 'storage', name: '수납', icon: '📦' },
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
    id: 'wallcube',
    name: '벽 큐브',
    description: '벽에 부착되는 테스트 큐브',
    icon: '📦',
    category: 'storage',
    modelClass: WallCube
  },
  {
    id: 'book',
    name: '책',
    description: '이미지와 두께를 설정할 수 있는 책',
    icon: '📚',
    category: 'decoration',
    modelClass: Book
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