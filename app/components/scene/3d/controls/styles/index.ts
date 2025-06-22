// 스타일 모듈들 통합 import 및 export
export { 
  WIN95_COLORS, 
  COMMON_STYLES, 
  ROOM_CONTROL_CONSTANTS 
} from './BaseStyles'

export { CONTAINER_STYLES } from './ContainerStyles'
export { BUTTON_STYLES } from './ButtonStyles'
export { GRID_STYLES } from './GridStyles'
export { FORM_STYLES, SLIDER_THUMB_CSS } from './FormStyles'
export { COMPONENT_STYLES } from './ComponentStyles'
export { MODAL_STYLES } from './ModalStyles'

// import 문 추가
import { CONTAINER_STYLES } from './ContainerStyles'
import { BUTTON_STYLES } from './ButtonStyles'
import { GRID_STYLES } from './GridStyles'
import { FORM_STYLES } from './FormStyles'
import { COMPONENT_STYLES } from './ComponentStyles'
import { MODAL_STYLES } from './ModalStyles'

// 기존 RoomControlsStyles.ts와 호환성을 위한 통합 export
export const ROOM_CONTROL_STYLES = {
  // 컨테이너 스타일들
  ...CONTAINER_STYLES,
  
  // 버튼 스타일들
  ...BUTTON_STYLES,
  
  // 그리드 스타일들
  ...GRID_STYLES,
  
  // 폼 스타일들
  ...FORM_STYLES,
  
  // 컴포넌트 스타일들
  ...COMPONENT_STYLES,
  
  // 모달 스타일들
  ...MODAL_STYLES
} as const

// 다른 모듈들에서 필요한 경우 개별적으로도 사용 가능
export * from './BaseStyles'
export * from './ContainerStyles'
export * from './ButtonStyles'
export * from './GridStyles'
export * from './FormStyles'
export * from './ComponentStyles'
export * from './ModalStyles' 