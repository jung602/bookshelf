'use client'

import { useState } from 'react'
import ThreeScene from './ThreeScene'
import ControlsContainer from './3d/controls/ControlsContainer'
import { SceneManager, RoomParams } from './3d/SceneManager'
import { useResponsiveDevice } from '../../hooks/useResponsiveDevice'

const Scene = () => {
  console.log('Scene: Component rendering');

  const { isMobile } = useResponsiveDevice()
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null)
  const [roomParams, setRoomParams] = useState<RoomParams>({ 
    wallHeight: 3, // 1에서 3으로 변경
    customGrid: (() => {
      const grid = Array(5).fill(null).map(() => Array(5).fill(false))
      grid[2][2] = true // 중앙 타일은 항상 활성화
      return grid
    })()
  })

  // SceneManager가 준비되었을 때 호출
  const handleSceneManagerReady = (newSceneManager: SceneManager) => {
    setSceneManager(newSceneManager)
  }

  // 룸 파라미터 변경 핸들러
  const handleRoomParamsChange = (newParams: RoomParams) => {
    setRoomParams(newParams)
  }



  return (
    <div className="w-full h-full relative bg-gradient-to-br from-gray-50 to-gray-100">
      <div className={isMobile ? "flex flex-col w-full h-full" : "w-full h-full"}>
        {/* 3D 씬 - 모바일에서는 위쪽 50%, 나머지에서는 전체 화면 */}
        <div className={isMobile ? "w-full h-1/2" : "w-full h-full"}>
          <ThreeScene 
            onSceneManagerReady={handleSceneManagerReady}
            roomParams={roomParams}
          />
        </div>
        
        {/* 컨트롤 UI - 모바일에서는 아래쪽 50%, 나머지에서는 하단 고정 */}
        <div className={isMobile 
          ? "w-full h-1/2" 
          : "fixed bottom-[80px] left-1/2 transform -translate-x-1/2 z-50"
        }>
          <ControlsContainer
            sceneManager={sceneManager}
            roomParams={roomParams}
            onRoomParamsChange={handleRoomParamsChange}
          />
        </div>
      </div>
    </div>
  )
}

export default Scene 