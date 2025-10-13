import { useState } from 'react'
import { TRANSITIONS, CONTROL_TOKENS } from '../utils/cssUtils'
import { SceneManager } from '../../SceneManager'
import { ControlButton, BoundingBoxIcon, BackIcon, CollapseIcon } from '../components'

interface TopBarProps {
  isMobile: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
  onGoBack?: () => void
  isDarkMode?: boolean
  sceneManager?: SceneManager | null
}

const TopBar = ({ isMobile, isCollapsed, onToggleCollapse, onGoBack, sceneManager }: TopBarProps) => {
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(false)
  
  const handleToggleBoundingBoxes = () => {
    if (sceneManager) {
      sceneManager.toggleBoundingBoxVisualization()
      setShowBoundingBoxes(!showBoundingBoxes)
    }
  }
  
  return (
    <div 
      className={`flex items-center ${isMobile ? 'justify-between' : 'justify-end'} ${TRANSITIONS.fast}`}
      style={{ padding: CONTROL_TOKENS.spacing.md }}
    >
      {/* 좌측 뒤로가기 버튼 (모바일에서 메뉴 선택 시만) */}
      {isMobile && onGoBack && (
        <ControlButton
          onClick={onGoBack}
          ariaLabel="뒤로가기"
        >
          <BackIcon />
        </ControlButton>
      )}

      {/* 가운데 펼치기/접기 버튼 (모바일에서만) */}
      {isMobile && (
        <ControlButton
          onClick={onToggleCollapse}
          ariaLabel={isCollapsed ? "펼치기" : "접기"}
        >
          <CollapseIcon isCollapsed={isCollapsed} />
        </ControlButton>
      )}

      {/* 우측 바운딩박스 토글 버튼 */}
      <ControlButton
        onClick={handleToggleBoundingBoxes}
        isActive={showBoundingBoxes}
        ariaLabel="바운딩박스 표시"
        title="바운딩박스 토글 (B)"
        size={isMobile ? 'md' : 'lg'}
        className={showBoundingBoxes ? 'bg-cyan-500 hover:bg-cyan-600' : ''}
      >
        <BoundingBoxIcon isActive={showBoundingBoxes} />
      </ControlButton>
    </div>
  )
}

export default TopBar 