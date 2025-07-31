import { 
  getThemeColors, 
  TRANSITIONS,
  getShadowStyles 
} from './utils/cssUtils'

interface TopBarProps {
  isMobile: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  onGoBack?: () => void
  isDarkMode?: boolean
}

const TopBar = ({ isMobile, isCollapsed, onToggleCollapse, onGoBack, isDarkMode = false }: TopBarProps) => {
  const themeColors = getThemeColors(isDarkMode)
  const shadowStyles = getShadowStyles(isDarkMode)
  
  return (
    <div 
      className={`flex items-center justify-between px-[12px] ${TRANSITIONS.fast}`}
    >
      {/* 좌측 뒤로가기 버튼 (모바일에서 메뉴 선택 시만) */}
      {isMobile && onGoBack ? (
        <button
          onClick={onGoBack}
          className={`flex items-center justify-center w-8 h-8 bg-white rounded-full hover:bg-gray-50 ${TRANSITIONS.colors}`}
          style={{
            boxShadow: shadowStyles.inactive
          }}
          aria-label="뒤로가기"
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none"
          >
            <path 
              d="M10 12L6 8L10 4" 
              stroke="#6B7280" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : (
        <div className="w-8 h-8"></div>
      )}

      {/* 가운데 펼치기/접기 버튼 (모바일에서만) */}
      {isMobile && (
        <button
          onClick={onToggleCollapse}
          className={`flex items-center justify-center w-8 h-8 bg-white rounded-full hover:bg-gray-50 ${TRANSITIONS.colors}`}
          style={{
            boxShadow: shadowStyles.inactive
          }}
          aria-label={isCollapsed ? "펼치기" : "접기"}
        >
          <svg 
            width="16" 
            height="16" 
            viewBox="0 0 16 16" 
            fill="none" 
            className={`transform ${TRANSITIONS.default} ${isCollapsed ? 'rotate-180' : ''}`}
          >
            <path 
              d="M4 6L8 10L12 6" 
              stroke="#6B7280" 
              strokeWidth="2" 
              strokeLinecap="round" 
              strokeLinejoin="round"
            />
          </svg>
        </button>
      )}

      {/* 우측 공간 (대칭을 위한 빈 공간) */}
      <div className="w-8 h-8"></div>
    </div>
  )
}

export default TopBar 