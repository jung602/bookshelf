// 개별 유틸리티 클래스들 임포트
import { ButtonFactory } from './ButtonFactory'
import { ColorPaletteUtils } from './ColorPaletteUtils'
import { ButtonStateManager } from './ButtonStateManager'

// Re-export 방식으로 통합 인터페이스 제공
export { ButtonFactory, type ToolButtonConfig, type ActionButtonConfig } from './ButtonFactory'
export { ColorPaletteUtils, type ColorPaletteConfig } from './ColorPaletteUtils'
export { ButtonStateManager } from './ButtonStateManager'

// 기존 API 호환성을 위한 UIUtils 클래스
export class UIUtils {
  // ButtonFactory에 위임
  public static createToolButton = ButtonFactory.createToolButton
  public static createActionButton = ButtonFactory.createActionButton
  
  // ColorPaletteUtils에 위임
  public static createCompactColorSection = ColorPaletteUtils.createCompactColorSection
  
  // ButtonStateManager에 위임
  public static updateToolButtons = ButtonStateManager.updateToolButtons
} 