// 기본 스타일 상수들

// Windows 95/98 스타일 색상 팔레트
export const WIN95_COLORS = {
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
export const COMMON_STYLES = {
  FONT_FAMILY: '"W95FA", "MS Sans Serif", sans-serif',
  FONT_SIZE: '11px',
  POSITION_FIXED: 'fixed',
  DISPLAY_FLEX: 'flex',
  ALIGN_CENTER: 'center',
  JUSTIFY_CENTER: 'center',
  BORDER_RADIUS_NONE: '0px',
  TRANSITION_NONE: 'none',
  BORDER_NONE: 'none',
  BORDER_SOLID: '1px solid rgba(0, 0, 0, 1)',
  BOXSHADOW_NONE: 'none',
  BOXSHADOW_OUTERBOX: 'inset -2px -2px rgba(126, 126, 126, 1), inset 2px 2px rgba(240, 240, 240, 1), inset -4px -4px #C0C0C0, inset 4px 4px #C0C0C0',
  BOXSHADOW_RAISED: 'inset -2px -2px rgba(126, 126, 126, 1), inset 2px 2px rgba(240, 240, 240, 1), inset 2px 2px rgba(179, 179, 179, 1)',
  BOXSHADOW_SUNKEN: 'inset -1px -1px  rgba(38, 38, 38, 1), inset 1px 1px rgba(255, 255, 255, 0.8), inset -2px -2px rgba(126, 126, 126, 1) ',
  BOXSHADOW_INSET: 'inset 1px 1px rgba(38, 38, 38, 1), inset 2px 2px rgba(126, 126, 126, 1),inset -1px -1px rgba(255, 255, 255, 0.8)',
  BOXSHADOW_INSET_RAISED: 'inset 2px 2px rgba(126, 126, 126, 1), inset -2px -2px rgba(240, 240, 240, 1)'
} as const

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