'use client'

import { SceneManager, RoomParams } from '../SceneManager'
import FloorTileControl from './FloorTileControl'
import TopBar from './TopBar'

interface ControlsContainerProps {
  sceneManager: SceneManager | null
  roomParams: RoomParams
  onRoomParamsChange: (params: RoomParams) => void
  isDarkMode: boolean
  isMobile: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export default function ControlsContainer({
  sceneManager,
  roomParams,
  onRoomParamsChange,
  isDarkMode,
  isMobile,
  isCollapsed,
  onToggleCollapse
}: ControlsContainerProps) {

  // 바닥 그리드 변경 핸들러
  const handleFloorGridChange = (grid: boolean[][]) => {
    const newParams = { ...roomParams, customGrid: grid }
    onRoomParamsChange(newParams)
  }

  return (
    <div className="w-full h-full flex flex-col">
      <TopBar 
        isMobile={isMobile}
        isCollapsed={isCollapsed}
        onToggleCollapse={onToggleCollapse}
        isDarkMode={isDarkMode}
      />
      {(!isMobile || !isCollapsed) && (
        <div className="flex-1 flex items-center justify-center">
          <FloorTileControl 
            isDarkMode={isDarkMode}
            onChange={handleFloorGridChange}
            initialGrid={roomParams.customGrid}
            sceneManager={sceneManager || undefined}
          />
        </div>
      )}
    </div>
  )
} 