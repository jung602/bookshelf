import { WIN95_COLORS, COMMON_STYLES } from './BaseStyles'

// 그리드 관련 스타일들
export const GRID_STYLES = {
  // 격자 컨테이너
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
    background: WIN95_COLORS.MIDDLE_BLUE,
    position: 'relative',
    overflow: 'hidden'
  },

  // 스타일 그리드 컨테이너
  STYLE_GRID_CONTAINER: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gridTemplateRows: 'repeat(2, 1fr)',
    gap: '4px',
    padding: '8px',
    backgroundColor: WIN95_COLORS.LIGHT_GRAY
  }
} as const 