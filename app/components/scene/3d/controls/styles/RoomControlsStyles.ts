// CSS 스타일 설정

// Windows 95/98 스타일 색상 팔레트
const WIN95_COLORS = {
  LIGHT_GRAY: '#C0C0C0',    // 주 배경색
  DARK_GRAY: '#808080',     // 어두운 테두리
  WHITE: '#FFFFFF',         // 밝은 테두리
  BLACK: '#000000',         // 텍스트/가장 어두운 테두리
  DARK_BLUE: '#02007F',     // 선택/활성화
  MIDDLE_BLUE: '#000EA3',   // 선택/활성화
  BLUE: '#001CF5',
  BUTTON_FACE: '#C0C0C0',   // 버튼 배경
  BUTTON_SHADOW: '#808080', // 버튼 그림자
  BUTTON_HIGHLIGHT: '#FFFFFF' // 버튼 하이라이트
} as const

// 공통 스타일 속성
const COMMON_STYLES = {
  FONT_FAMILY: '"W95FA", "MS Sans Serif", sans-serif',
  FONT_SIZE: '11px',
  POSITION_FIXED: 'fixed',
  DISPLAY_FLEX: 'flex',
  ALIGN_CENTER: 'center',
  JUSTIFY_CENTER: 'center',
  BORDER_RADIUS_NONE: '0px',
  TRANSITION_NONE: 'none',
  BORDER_NONE: 'none',
  BORDER_SOLID: '0px solid rgba(0, 0, 0, 0.5)',
  BOXSHADOW_NONE: 'none',
  BOXSHADOW_OUTERBOX: 'inset -2px -2px rgba(126, 126, 126, 1), inset 2px 2px rgba(240, 240, 240, 1), inset -4px -4px #C0C0C0, inset 4px 4px #C0C0C0',
  BOXSHADOW_RAISED: 'inset -2px -2px rgba(126, 126, 126, 1), inset 2px 2px rgba(240, 240, 240, 1), inset 2px 2px rgba(179, 179, 179, 1)',
  BOXSHADOW_SUNKEN: 'inset -1px -1px  rgba(38, 38, 38, 1), inset 1px 1px rgba(255, 255, 255, 0.8), inset -2px -2px rgba(126, 126, 126, 1) ',
  BOXSHADOW_INSET: 'inset 1px 1px rgba(38, 38, 38, 1), inset 2px 2px rgba(126, 126, 126, 1),inset -1px -1px rgba(255, 255, 255, 0.8)',
  BOXSHADOW_INSET_RAISED: 'inset 2px 2px rgba(126, 126, 126, 1), inset -2px -2px rgba(240, 240, 240, 1)'
}

export const ROOM_CONTROL_STYLES = {
  // 통합 컨테이너 스타일 (버튼 상태)
  CONTAINER_BUTTON: {
    position: COMMON_STYLES.POSITION_FIXED,
    top: '20px',
    right: '20px',
    transform: 'none',
    zIndex: '1000',
    width: '280px',
    height: '36px',
    backgroundColor: WIN95_COLORS.DARK_BLUE,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    cursor: 'pointer',
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    justifyContent: 'flex-start',
    transition: COMMON_STYLES.TRANSITION_NONE,
    overflow: 'hidden',
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    fontSize: COMMON_STYLES.FONT_SIZE, 
    padding: '4px',
    boxShadow: COMMON_STYLES.BOXSHADOW_OUTERBOX,
    border: COMMON_STYLES.BORDER_SOLID
  },

  // 통합 컨테이너 스타일 (패널 상태)
  CONTAINER_PANEL: {
    position: COMMON_STYLES.POSITION_FIXED,
    top: '20px',
    right: '20px',
    transform: 'none',
    zIndex: '1000',
    height: 'auto',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    cursor: 'pointer',
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'column',
    transition: COMMON_STYLES.TRANSITION_NONE,
    overflow: 'hidden',
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    fontSize: COMMON_STYLES.FONT_SIZE,
    padding: '4px',
    boxShadow: COMMON_STYLES.BOXSHADOW_RAISED
  },

  // 헤더 컨테이너 스타일 (아이콘과 제목을 포함)
  HEADER_CONTAINER: {
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    justifyContent: 'space-between',
    width: '100%',
    height: '28px',
    gap: '8px',
    padding: '4px',
    margin: '0',
    position: 'relative',
    backgroundColor: WIN95_COLORS.DARK_BLUE
  },

  // 헤더 왼쪽 부분 (아이콘 + 제목)
  HEADER_LEFT: {
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    gap: '8px',
    flexShrink: '0',
    flexGrow: '1',
    minWidth: '0'
  },

  // 헤더 오른쪽 부분 (닫기 버튼)
  HEADER_RIGHT: {
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    flexShrink: '0',
    marginLeft: 'auto'
  },

  // 버튼 아이콘 컨테이너
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

  // 제목 텍스트 스타일
  TITLE_TEXT: {
    fontSize: COMMON_STYLES.FONT_SIZE,
    fontWeight: 'bold',
    color: WIN95_COLORS.WHITE,
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    userSelect: 'none',
    whiteSpace: 'nowrap',
    margin: '0',
    padding: '0'
  },

  // 패널 콘텐츠 컨테이너
  PANEL_CONTENT: {
    background: WIN95_COLORS.LIGHT_GRAY,
    padding: '4px',
    position: 'relative',
    width: '100%',
    opacity: '0',
    transition: COMMON_STYLES.TRANSITION_NONE,
    pointerEvents: 'none',
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET
  },
  
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
  
  // 격자 관련 스타일
  GRID_CONTAINER: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gridTemplateRows: 'repeat(5, 1fr)',
    gap: '2px',
    width: '100%',
    aspectRatio: '1',
    background: WIN95_COLORS.LIGHT_GRAY,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET,
    margin: '16px 0',
    userSelect: 'none',
    boxSizing: 'border-box',
    padding: '4px'
  },
  
  GRID_CELL: {
    background: WIN95_COLORS.WHITE,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    transition: COMMON_STYLES.TRANSITION_NONE,
    cursor: 'pointer'
  },
  
  ACTIVE_CELL: {
    background: WIN95_COLORS.DARK_BLUE
  },
  
  CENTER_CELL: {
    background: WIN95_COLORS.DARK_GRAY,
    cursor: 'not-allowed',
    opacity: '1'
  },
  
  // 버튼 관련 스타일
  BUTTON: {
    width: '100%',
    padding: '4px 4px',
    margin: '2px 0',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    cursor: 'pointer',
    fontSize: COMMON_STYLES.FONT_SIZE,
    fontWeight: 'normal',
    color: WIN95_COLORS.BLACK,
    transition: COMMON_STYLES.TRANSITION_NONE,
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    boxShadow: COMMON_STYLES.BOXSHADOW_SUNKEN
  },

  // 프리셋 관련 스타일
  PRESETS_CONTAINER: {
    display: COMMON_STYLES.DISPLAY_FLEX,
    gap: '4px',
    marginTop: '8px',
    justifyContent: COMMON_STYLES.JUSTIFY_CENTER
  },

  PRESET_ICON_BUTTON: {
    width: '32px',
    height: '32px',
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    border: COMMON_STYLES.BORDER_NONE,
    background: WIN95_COLORS.LIGHT_GRAY,
    outline: 'none',
    cursor: 'pointer',
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    justifyContent: COMMON_STYLES.JUSTIFY_CENTER,
    transition: COMMON_STYLES.TRANSITION_NONE,
    boxShadow: COMMON_STYLES.BOXSHADOW_RAISED,
    padding: '2px'
  },

  PRESET_ICON_IMAGE: {
    width: '16px',
    height: '16px',
    opacity: '1'
  },

  PRESET_ICON_BUTTON_HOVER: {
    backgroundColor: WIN95_COLORS.LIGHT_GRAY
  },

  // Pixelation Controls 스타일
  PIXELATION_PANEL: {
    position: COMMON_STYLES.POSITION_FIXED,
    top: '20px',
    right: '20px',
    zIndex: '1000',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE
  },



  // 닫기 버튼 스타일
  CLOSE_BUTTON: {
    position: 'relative',
    width: '20px',
    height: '20px',
    cursor: 'pointer',
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    justifyContent: COMMON_STYLES.JUSTIFY_CENTER,
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    transition: COMMON_STYLES.TRANSITION_NONE,
    boxShadow: COMMON_STYLES.BOXSHADOW_RAISED,
    flexShrink: '0'
  },

  CLOSE_BUTTON_HOVER: {
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET_RAISED
  },

  // 닫기 버튼 아이콘 이미지 스타일
  CLOSE_BUTTON_IMAGE: {
    width: '12px',
    height: '12px',
    opacity: '1'
  },

  // 일반 버튼 호버 스타일 
  BUTTON_HOVER: {
    backgroundColor: WIN95_COLORS.LIGHT_GRAY
  },

  // 버튼 아이콘 이미지 스타일
  BUTTON_ICON_IMAGE: {
    width: '20px',
    height: '20px',
    opacity: '1'
  },

  // 섹션 타이틀 스타일
  SECTION_TITLE: {
    fontSize: COMMON_STYLES.FONT_SIZE,
    fontWeight: 'bold',
    color: WIN95_COLORS.BLACK,
    marginBottom: '2px',
    marginTop: '0px',
    textAlign: 'left',
    fontFamily: COMMON_STYLES.FONT_FAMILY
  },

  // 섹션 컨테이너 스타일
  SECTION_CONTAINER: {
    padding: '4px',
    marginBottom: '4px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE, 
    boxShadow: COMMON_STYLES.BOXSHADOW_SUNKEN

  },

  // 첫 번째 섹션 (여백 조정)
  SECTION_CONTAINER_FIRST: {
    marginTop: '0px'
  },

  // Style 패널 전용 스타일들
  STYLE_GRID_CONTAINER: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: '4px',
    width: '100%',
    height: '120px'
  },

  // 타일 캔버스 스타일들
  TILE_CANVAS_CONTAINER: {
    display: 'grid',
    gridTemplateColumns: 'repeat(10, 1fr)',
    gridTemplateRows: 'repeat(10, 1fr)',
    gap: '1px',
    width: '100%',
    height: '100%',
    backgroundColor: WIN95_COLORS.BLACK,
    border: '2px inset #C0C0C0'
  },

  TILE_CANVAS_CELL: {
    backgroundColor: WIN95_COLORS.WHITE,
    cursor: 'crosshair'
  },

  TILE_CANVAS_CELL_PAINTED: {
    backgroundColor: WIN95_COLORS.DARK_GRAY
  },

  // 컴팩트 컬러 섹션 스타일들
  COMPACT_COLOR_CONTAINER: {
    display: COMMON_STYLES.DISPLAY_FLEX,
    flexDirection: 'column',
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    height: '100%',
    fontSize: '8px'
  },

  COMPACT_COLOR_LABEL: {
    fontSize: '8px',
    marginBottom: '2px',
    color: WIN95_COLORS.BLACK,
    fontFamily: COMMON_STYLES.FONT_FAMILY
  },

  COMPACT_COLOR_DISPLAY: {
    width: '20px',
    height: '20px',
    border: '1px solid #000000',
    cursor: 'pointer'
  },

  // 컬러 팔레트 스타일들
  COLOR_PALETTE_CONTAINER: {
    display: 'none',
    position: COMMON_STYLES.POSITION_FIXED,
    zIndex: '1001',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    border: '2px solid #000000',
    padding: '4px',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gridTemplateRows: 'repeat(4, 1fr)',
    gap: '2px',
    width: '120px',
    height: '120px'
  },

  COLOR_PALETTE_CELL: {
    width: '24px',
    height: '24px',
    border: '1px solid #000000',
    cursor: 'pointer',
    boxShadow: 'inset -1px -1px rgba(0, 0, 0, 0.5), inset 1px 1px rgba(255, 255, 255, 0.8)'
  },

  COLOR_PALETTE_CELL_HOVER: {
    boxShadow: 'inset 1px 1px rgba(0, 0, 0, 0.5), inset -1px -1px rgba(255, 255, 255, 0.8)'
  },

  // 도구 버튼 스타일들
  TOOL_BUTTON: {
    width: '100%',
    height: '100%',
    fontSize: '14px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    color: WIN95_COLORS.BLACK,
    border: COMMON_STYLES.BORDER_NONE,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    cursor: 'pointer',
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    boxShadow: COMMON_STYLES.BOXSHADOW_RAISED
  },

  TOOL_BUTTON_SELECTED: {
    backgroundColor: WIN95_COLORS.DARK_BLUE,
    color: WIN95_COLORS.WHITE,
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET
  },

  // 액션 버튼 스타일들
  ACTION_BUTTON: {
    width: '100%',
    height: '100%',
    fontSize: '10px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    color: WIN95_COLORS.BLACK,
    border: COMMON_STYLES.BORDER_NONE,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    cursor: 'pointer',
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    boxShadow: COMMON_STYLES.BOXSHADOW_RAISED
  },

  ACTION_BUTTON_HOVER: {
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET_RAISED
  },

  // 아이콘이 포함된 버튼 스타일들
  ICON_BUTTON_CONTAINER: {
    width: '100%',
    height: '100%',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    color: WIN95_COLORS.BLACK,
    border: COMMON_STYLES.BORDER_NONE,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    cursor: 'pointer',
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    boxShadow: COMMON_STYLES.BOXSHADOW_RAISED,
    display: COMMON_STYLES.DISPLAY_FLEX,
    flexDirection: 'column',
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    justifyContent: COMMON_STYLES.JUSTIFY_CENTER,
    padding: '2px',
    gap: '2px'
  },

  ICON_BUTTON_CONTAINER_SELECTED: {
    backgroundColor: WIN95_COLORS.DARK_BLUE,
    color: WIN95_COLORS.WHITE,
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET
  },

  ICON_BUTTON_CONTAINER_HOVER: {
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET_RAISED
  },

  ICON_BUTTON_ICON_CONTAINER: {
    width: '20px',
    height: '20px',
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    justifyContent: COMMON_STYLES.JUSTIFY_CENTER,
    backgroundColor: WIN95_COLORS.WHITE,
  },

  ICON_BUTTON_ICON_IMAGE: {
    width: '20px',
    height: '20px',
    opacity: '1'
  },

  ICON_BUTTON_TEXT: {
    fontSize: '14px',
    fontWeight: 'normal',
    textAlign: COMMON_STYLES.ALIGN_CENTER,
    margin: '0',
    padding: '0',
    lineHeight: '1'
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

// 상수들
export const ROOM_CONTROL_CONSTANTS = {
  GRID_SIZE: 5,
  get CENTER_INDEX() { return Math.floor(this.GRID_SIZE / 2) },
  
  // 애니메이션 타이밍
  ICON_FADE_DELAY: 150,
  CONTENT_SHOW_DELAY: 550,
  CONTENT_HIDE_DELAY: 200,
  ICON_SHOW_DELAY: 600
} as const

