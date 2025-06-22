import { WIN95_COLORS, COMMON_STYLES } from './BaseStyles'

// 컨테이너 관련 스타일들
export const CONTAINER_STYLES = {
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
  }
} as const 