import { useState } from 'react'
import { 
  TRANSITIONS,
  getShadowStyles 
} from './utils/cssUtils'
import { SceneManager } from '../SceneManager'

interface TopBarProps {
  isMobile: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  onGoBack?: () => void
  isDarkMode?: boolean
  sceneManager?: SceneManager | null
}

const TopBar = ({ isMobile, isCollapsed, onToggleCollapse, onGoBack, isDarkMode = false, sceneManager }: TopBarProps) => {
  const shadowStyles = getShadowStyles(isDarkMode)
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(false)
  
  const handleToggleBoundingBoxes = () => {
    if (sceneManager) {
      sceneManager.toggleBoundingBoxVisualization()
      setShowBoundingBoxes(!showBoundingBoxes)
    }
  }
  
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
            boxShadow: shadowStyles.inactive,
            border: 'none',
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
            boxShadow: shadowStyles.inactive,
            border: 'none',
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

      {/* 우측 바운딩박스 토글 버튼 */}
      <button
        onClick={handleToggleBoundingBoxes}
        className={`flex items-center justify-center w-8 h-8 rounded-full hover:bg-gray-50 ${TRANSITIONS.colors} ${
          showBoundingBoxes ? 'bg-cyan-500 hover:bg-cyan-600' : 'bg-white'
        }`}
        style={{
          boxShadow: shadowStyles.inactive,
          border: 'none',
        }}
        aria-label="바운딩박스 표시"
        title="바운딩박스 토글 (B)"
      >
        <svg 
          width="16" 
          height="16" 
          viewBox="0 0 16 16" 
          fill="none"
        >
          <rect 
            x="3" 
            y="3" 
            width="10" 
            height="10" 
            stroke={showBoundingBoxes ? '#ffffff' : '#6B7280'}
            strokeWidth="2"
            strokeDasharray="2 2"
            fill="none"
          />
          <circle cx="3" cy="3" r="1.5" fill={showBoundingBoxes ? '#00ffff' : '#6B7280'} />
          <circle cx="13" cy="3" r="1.5" fill={showBoundingBoxes ? '#00ffff' : '#6B7280'} />
          <circle cx="3" cy="13" r="1.5" fill={showBoundingBoxes ? '#00ffff' : '#6B7280'} />
          <circle cx="13" cy="13" r="1.5" fill={showBoundingBoxes ? '#00ffff' : '#6B7280'} />
        </svg>
      </button>
    </div>
  )
}

export default TopBar 