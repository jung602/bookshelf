import { WIN95_COLORS, COMMON_STYLES } from './BaseStyles'

// 컴포넌트 관련 스타일들
export const COMPONENT_STYLES = {
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

  // 타일 캔버스 관련
  TILE_CANVAS_CONTAINER: {
    width: '64px',
    height: '64px',
    backgroundColor: WIN95_COLORS.WHITE,
    border: '2px inset #C0C0C0',
    display: 'grid',
    gridTemplateColumns: 'repeat(8, 1fr)',
    gridTemplateRows: 'repeat(8, 1fr)',
    gap: '0',
    cursor: 'crosshair'
  },

  TILE_CANVAS_CELL: {
    backgroundColor: WIN95_COLORS.WHITE,
    border: '1px solid #E0E0E0'
  },

  TILE_CANVAS_CELL_PAINTED: {
    backgroundColor: WIN95_COLORS.BLACK
  },

  // 컴팩트 색상 섹션
  COMPACT_COLOR_CONTAINER: {
    display: COMMON_STYLES.DISPLAY_FLEX,
    flexDirection: 'column',
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    gap: '4px',
    padding: '4px'
  },

  COMPACT_COLOR_LABEL: {
    fontSize: '10px',
    color: WIN95_COLORS.BLACK,
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    margin: '0'
  },

  COMPACT_COLOR_DISPLAY: {
    width: '20px',
    height: '20px',
    border: '1px solid #000000',
    cursor: 'pointer',
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET
  },

  // 색상 팔레트
  COLOR_PALETTE_CONTAINER: {
    position: 'absolute',
    top: '24px',
    left: '0',
    zIndex: '1001',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    border: '1px solid #000000',
    boxShadow: '2px 2px 4px rgba(0, 0, 0, 0.3)',
    padding: '4px',
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: '2px',
    minWidth: '100px'
  },

  COLOR_PALETTE_CELL: {
    width: '16px',
    height: '16px',
    cursor: 'pointer',
    border: '1px solid #000000'
  },

  COLOR_PALETTE_CELL_HOVER: {
    borderWidth: '2px'
  },

  // 아이콘 버튼 관련
  ICON_BUTTON_CONTAINER: {
    width: '100%',
    height: '32px',
    padding: '4px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY,
    borderRadius: COMMON_STYLES.BORDER_RADIUS_NONE,
    cursor: 'pointer',
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    gap: '8px',
    transition: COMMON_STYLES.TRANSITION_NONE,
    boxShadow: COMMON_STYLES.BOXSHADOW_RAISED,
    border: COMMON_STYLES.BORDER_SOLID,
    textAlign: 'left'
  },

  ICON_BUTTON_CONTAINER_SELECTED: {
    backgroundColor: WIN95_COLORS.DARK_BLUE,
    color: WIN95_COLORS.WHITE,
    boxShadow: COMMON_STYLES.BOXSHADOW_INSET
  },

  ICON_BUTTON_CONTAINER_HOVER: {
    backgroundColor: WIN95_COLORS.BUTTON_HIGHLIGHT
  },

  ICON_BUTTON_ICON_CONTAINER: {
    width: '20px',
    height: '20px',
    display: COMMON_STYLES.DISPLAY_FLEX,
    alignItems: COMMON_STYLES.ALIGN_CENTER,
    justifyContent: COMMON_STYLES.JUSTIFY_CENTER,
    flexShrink: '0'
  },

  ICON_BUTTON_ICON_IMAGE: {
    width: '16px',
    height: '16px',
    display: 'block'
  },

  ICON_BUTTON_TEXT: {
    fontSize: COMMON_STYLES.FONT_SIZE,
    fontFamily: COMMON_STYLES.FONT_FAMILY,
    color: 'inherit',
    fontWeight: 'normal',
    margin: '0',
    flexGrow: '1'
  }
} as const 