import { 
  getThemeColors, 
  TRANSITIONS,
  getShadowStyles 
} from './cssUtils'

interface TopBarProps {
  isMobile: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  isDarkMode?: boolean
}

const TopBar = ({ isMobile, isCollapsed, onToggleCollapse, isDarkMode = false }: TopBarProps) => {
  const themeColors = getThemeColors(isDarkMode)
  const shadowStyles = getShadowStyles(isDarkMode)
  
  // 상단만 라운드 처리를 위한 클래스 (컨테이너 라운드에서 상단만 추출)
  const topRoundingClass = isMobile ? 'rounded-t-[20px]' : 'rounded-t-[30px]'
  
  return (
    <div 
      className={`w-full h-[42px] ${topRoundingClass} relative flex items-center justify-center ${TRANSITIONS.fast}`}
      style={{ 
        backgroundColor: isDarkMode ? themeColors.gridContainer : themeColors.outerContainer,
      }}
    >
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
    </div>
  )
}

export default TopBar 