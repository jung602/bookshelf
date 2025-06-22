import { WIN95_COLORS, COMMON_STYLES } from './BaseStyles'

// 폼 및 입력 관련 스타일들
export const FORM_STYLES = {
  // 슬라이더 관련 스타일
  SLIDER: {
    width: '100%',
    height: '24px',
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    background: WIN95_COLORS.WHITE,
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET,
    outline: 'none',
    cursor: 'pointer',
    margin: '0 0 16px 0',
    WebkitAppearance: 'none',
    MozAppearance: 'none',
    appearance: 'none',
    padding: '4px'
  },

  // 섹션 관련
  SECTION_TITLE: {
    fontSize: COMMON_STYLES.FONT_SIZE,
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    color: WIN95_COLORS.BLACK,
    fontWeight: 'bold',
    margin: '0 0 8px 0',
    padding: '0',
    textAlign: 'left',
    userSelect: 'none'
  },

  SECTION_CONTAINER: {
    marginBottom: '16px',
    padding: '8px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY
  },

  SECTION_CONTAINER_FIRST: {
    marginBottom: '16px',
    padding: '8px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    marginTop: '0'
  },

  // 픽셀레이션 패널
  PIXELATION_PANEL: {
    position: 'relative',
    width: '100%',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    border: COMMON_STYLES.BORDER_SOLID,
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET,
    padding: '4px',
    margin: '4px 0'
  }
} as const

// 슬라이더 핸들 CSS (가상 요소용)
export const SLIDER_THUMB_CSS = `
  input[type="range"]::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 0px;
    box-shadow: ${COMMON_STYLES.BOXSHADOW_RAISED};
    background: ${WIN95_COLORS.LIGHT_GRAY};
    cursor: pointer;
  }
  
  input[type="range"]::-moz-range-thumb {
    appearance: none;
    width: 16px;
    height: 16px;
    border-radius: 0px;
    background: ${WIN95_COLORS.LIGHT_GRAY};
    box-shadow: ${COMMON_STYLES.BOXSHADOW_RAISED};
    cursor: pointer;
  }
` 