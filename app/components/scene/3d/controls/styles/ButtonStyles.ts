import { WIN95_COLORS, COMMON_STYLES } from './BaseStyles'

// 버튼 관련 스타일들
export const BUTTON_STYLES = {
  // 기본 버튼 아이콘
  BUTTON_ICON: {
    position: 'relative',
    width: '20px',
    height: '20px',
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    justifyContent: COMMON_STYLES.JUSTIFY_CENTER,
    transition: COMMON_STYLES.TRANSITION_NONE,
    opacity: '1',
    transform: 'scale(1)',
    pointerEvents: 'auto',
    padding: '4px',
    flexShrink: '0',
    backgroundColor: WIN95_COLORS.WHITE
  },

  BUTTON_ICON_IMAGE: {
    width: '16px',
    height: '16px',
    display: 'block'
  },

  // 기본 버튼
  BUTTON: {
    width: '100%',
    height: '36px',
    padding: '4px 8px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    cursor: 'pointer',
    color: WIN95_COLORS.BLACK,
    fontSize: COMMON_STYLES.FONT_SIZE,
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    fontWeight: 'normal',
    textAlign: 'left',
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    gap: '8px',
    transition: COMMON_STYLES.TRANSITION_NONE,
    boxShadow: COMMON_STYLES.BOXSHADOW_RAISED,
    border: COMMON_STYLES.BORDER_SOLID
  },

  BUTTON_HOVER: {
    backgroundColor: WIN95_COLORS.BUTTON_HIGHLIGHT
  },

  // 닫기 버튼
  CLOSE_BUTTON: {
    width: '20px',
    height: '20px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    cursor: 'pointer',
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    justifyContent: COMMON_STYLES.JUSTIFY_CENTER,
    transition: COMMON_STYLES.TRANSITION_NONE,
    flexShrink: '0',
    boxShadow: COMMON_STYLES.BOXSHADOW_RAISED,
    border: COMMON_STYLES.BORDER_SOLID
  },

  CLOSE_BUTTON_HOVER: {
    backgroundColor: WIN95_COLORS.BUTTON_HIGHLIGHT,
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET
  },

  CLOSE_BUTTON_IMAGE: {
    width: '12px',
    height: '12px',
    display: 'block'
  },

  // 프리셋 버튼들
  PRESETS_CONTAINER: {
    display: COMMON_STYLES.DISPLAY_FLEX,
    gap: '4px',
    marginTop: '16px'
  },

  PRESET_ICON_BUTTON: {
    width: '40px',
    height: '40px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    cursor: 'pointer',
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    justifyContent: COMMON_STYLES.JUSTIFY_CENTER,
    transition: COMMON_STYLES.TRANSITION_NONE,
    boxShadow: COMMON_STYLES.BOXSHADOW_RAISED,
    border: COMMON_STYLES.BORDER_SOLID
  },

  PRESET_ICON_IMAGE: {
    width: '24px',
    height: '24px',
    display: 'block'
  },

  PRESET_ICON_BUTTON_HOVER: {
    backgroundColor: WIN95_COLORS.BUTTON_HIGHLIGHT,
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET
  },

  // 도구 버튼
  TOOL_BUTTON: {
    width: '100%',
    height: '32px',
    padding: '4px 8px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    cursor: 'pointer',
    color: WIN95_COLORS.BLACK,
    fontSize: COMMON_STYLES.FONT_SIZE,
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    fontWeight: 'normal',
    textAlign: 'center',
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    justifyContent: COMMON_STYLES.JUSTIFY_CENTER,
    transition: COMMON_STYLES.TRANSITION_NONE,
    boxShadow: COMMON_STYLES.BOXSHADOW_RAISED,
    border: COMMON_STYLES.BORDER_SOLID
  },

  TOOL_BUTTON_SELECTED: {
    backgroundColor: WIN95_COLORS.DARK_BLUE,
    color: WIN95_COLORS.WHITE,
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET
  },

  // 액션 버튼
  ACTION_BUTTON: {
    width: '100%',
    height: '32px',
    padding: '4px 8px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    cursor: 'pointer',
    color: WIN95_COLORS.BLACK,
    fontSize: COMMON_STYLES.FONT_SIZE,
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    fontWeight: 'normal',
    textAlign: 'center',
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    justifyContent: COMMON_STYLES.JUSTIFY_CENTER,
    transition: COMMON_STYLES.TRANSITION_NONE,
    boxShadow: COMMON_STYLES.BOXSHADOW_RAISED,
    border: COMMON_STYLES.BORDER_SOLID
  },

  ACTION_BUTTON_HOVER: {
    backgroundColor: WIN95_COLORS.BUTTON_HIGHLIGHT,
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET_RAISED
  }
} as const 