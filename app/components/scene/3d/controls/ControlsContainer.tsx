'use client'

import { SceneManager, RoomParams } from '../SceneManager'
import FloorTileControl from './FloorTileControl'

interface ControlsContainerProps {
  sceneManager: SceneManager | null
  roomParams: RoomParams
  onRoomParamsChange: (params: RoomParams) => void
  isDarkMode: boolean
}

export default function ControlsContainer({
  sceneManager,
  roomParams,
  onRoomParamsChange,
  isDarkMode
}: ControlsContainerProps) {

  // 바닥 그리드 변경 핸들러
  const handleFloorGridChange = (grid: boolean[][]) => {
    const newParams = { ...roomParams, customGrid: grid }
    onRoomParamsChange(newParams)
  }

  return (
    <div className="w-full h-full">
      <div className="w-full h-full flex items-center justify-center">
          <FloorTileControl 
            isDarkMode={isDarkMode}
            onChange={handleFloorGridChange}
            initialGrid={roomParams.customGrid}
            sceneManager={sceneManager || undefined}
          />
      </div>
    </div>
  )
} 