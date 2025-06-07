// CSS 스타일 설정
export const ROOM_CONTROL_STYLES = {
  // 통합 컨테이너 스타일 (버튼 상태)
  CONTAINER_BUTTON: {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '1000',
    width: '36px',
    height: '36px',
    backgroundColor: 'rgba(253, 254, 255, 0)',
    borderRadius: '8px',
    border: '1px solid rgba(200, 200, 200, 0)',
    boxShadow: 'none',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px'
  },

  // 통합 컨테이너 스타일 (패널 상태)
  CONTAINER_PANEL: {
    position: 'fixed',
    top: '20px',
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: '1000',
    width: '280px',
    height: 'auto',
    backgroundColor: 'rgba(248, 250, 252, 0.4)',
    backdropFilter: 'blur(8px)',
    borderRadius: '8px',
    border: '1px solid rgba(200, 200, 200, 0.5)',
    boxShadow: 'none',
    cursor: 'default',
    display: 'flex',
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
    flexDirection: 'column',
    transition: 'all 0.4s cubic-bezier(0.25, 0.8, 0.25, 1)',
    overflow: 'hidden',
    fontFamily: 'system-ui, -apple-system, sans-serif',
    fontSize: '14px',
    padding: '8px'
  },

  // 버튼 아이콘 컨테이너
  BUTTON_ICON: {
    position: 'absolute',
    top: '0',
    left: '0',
    width: '100%',
    height: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'opacity 0.25s ease, transform 0.25s ease',
    opacity: '1',
    transform: 'scale(1)',
    pointerEvents: 'auto'
  },

  // 패널 콘텐츠 컨테이너
  PANEL_CONTENT: {
    position: 'relative',
    width: '100%',
    opacity: '0',
    transition: 'opacity 0.3s ease',
    pointerEvents: 'none'
  },
  
  // 슬라이더 스타일
  SLIDER: {
    width: '100%',
    height: '4px',
    borderRadius: '2px',
    background: 'rgba(200, 200, 200, 0.3)',
    outline: 'none',
    cursor: 'pointer',
    marginBottom: '16px'
  },
  
  SLIDER_LABEL: {
    display: 'block',
    marginBottom: '8px',
    fontWeight: '500',
    color: '#333'
  },
  
  // 격자 컨테이너 스타일
  GRID_CONTAINER: {
    display: 'grid',
    gridTemplateColumns: 'repeat(5, 1fr)',
    gridTemplateRows: 'repeat(5, 1fr)',
    gap: '4px',
    width: '100%',
    aspectRatio: '1',
    background: 'rgba(200, 200, 200, 0)',
    borderRadius: '12px',
    margin: '16px 0',
    userSelect: 'none',
    boxSizing: 'border-box'
  },
  
  // 격자 셀 기본 스타일
  GRID_CELL: {
    background: 'rgba(0, 0, 0, 0.05)',
    border: '1px solid rgba(0, 0, 0, 0.02)',
    backdropFilter: 'blur(8px)',
    borderRadius: '4px',
    transition: 'all 0.2s',
    cursor: 'pointer'
  },
  
  // 활성화된 셀 스타일
  ACTIVE_CELL: {
    background: '#ff6b6b',
    borderColor: '#ff5252'
  },
  
  // 중앙 타일 스타일
  CENTER_CELL: {
    background: 'rgba(0, 0, 0, 0.2)',
    border: '1px solid rgba(0, 0, 0, 0.2)',
    cursor: 'not-allowed',
    opacity: '0.7'
  },
  
  // 버튼 스타일
  BUTTON: {
    width: '100%',
    padding: '8px 12px',
    margin: '4px 0',
    backgroundColor: 'rgba(255, 255, 255, 0)',
    border: '1px solid rgba(200, 200, 200, 0.3)',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    color: '#333',
    transition: 'all 0.2s'
  }
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

// 버튼 아이콘 SVG
export const ROOM_CONTROL_ICON = `
  <svg width="22" height="22" viewBox="0 0 197 198" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="9.25" y="9.5" width="80" height="80" rx="20" fill="#DCDCDC"/>
    <rect x="107.75" y="9.5" width="80" height="80" rx="20" fill="#DCDCDC"/>
    <rect x="9.25" y="108.5" width="80" height="80" rx="20" fill="#DCDCDC"/>
    <rect x="107.75" y="108.5" width="80" height="80" rx="20" fill="#DCDCDC"/>
  </svg>
` 