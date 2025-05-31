// 모든 모델들을 자동으로 import하고 메타데이터를 수집
import { modelMetadata as stoolMetadata } from './stool'
import { modelMetadata as chairMetadata } from './chair'
import { modelMetadata as bookMetadata } from './book'

// 모델 메타데이터 타입 정의
export interface ModelMetadata {
  id: string
  name: string
  description: string
  icon: string
  modelClass: any
}

// 모든 모델 메타데이터를 배열로 수집
export const allModels: ModelMetadata[] = [
  stoolMetadata,
  chairMetadata,
  bookMetadata
]

// 모델 ID로 모델 클래스를 찾는 함수
export function getModelClass(modelId: string) {
  const modelMetadata = allModels.find(model => model.id === modelId)
  return modelMetadata?.modelClass || null
}

// UI에서 사용할 모델 리스트 (ModelClass 제외)
export const availableModels = allModels.map(({ modelClass, ...rest }) => rest) 