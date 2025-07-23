'use client'

import { useState, useEffect } from 'react'
import ThreeScene from './ThreeScene'
import ControlsContainer from './3d/controls/ControlsContainer'
import { SceneManager, RoomParams } from './3d/SceneManager'

const Scene = () => {
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null)
  const [isLandscape, setIsLandscape] = useState(true)
  const [isControlsCollapsed, setIsControlsCollapsed] = useState(false)
  const [roomParams, setRoomParams] = useState<RoomParams>({ 
    wallHeight: 3, // 1에서 3으로 변경
    customGrid: (() => {
      const grid = Array(5).fill(null).map(() => Array(5).fill(false))
      grid[2][2] = true // 중앙 타일은 항상 활성화
      return grid
    })()
  })

  // 브라우저 크기 변화 감지
  useEffect(() => {
    const updateOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight)
    }

    updateOrientation()
    window.addEventListener('resize', updateOrientation)
    
    return () => window.removeEventListener('resize', updateOrientation)
  }, [])

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
      {/* 토글 버튼 - 항상 표시 */}
      <button
        onClick={() => setIsControlsCollapsed(!isControlsCollapsed)}
        className="absolute z-20 bg-white bg-opacity-90 hover:bg-opacity-100 rounded-lg p-2 shadow-lg transition-all duration-200 hover:scale-105"
        style={{
          ...(isControlsCollapsed 
            ? { top: '16px', right: '16px' }
            : isLandscape 
              ? { top: '16px', right: 'calc(50vh + 4px)' }
              : { left: '16px', bottom: '4px' }
          )
        }}
        title={isControlsCollapsed ? "컨트롤 패널 열기" : "컨트롤 패널 접기"}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {isControlsCollapsed ? (
            <path d="M18 15l-6-6-6 6"/>
          ) : isLandscape ? (
            <path d="M15 18l-6-6 6-6"/>
          ) : (
            <path d="M6 9l6 6 6-6"/>
          )}
        </svg>
      </button>

      {isControlsCollapsed ? (
        // 접힌 상태: ThreeScene 전체 화면
        <div className="w-full h-full">
          <ThreeScene 
            onSceneManagerReady={handleSceneManagerReady}
            roomParams={roomParams}
          />
        </div>
      ) : isLandscape ? (
        // 가로 모드: 우측 컨트롤의 넓이는 높이의 1/2
        <div className="flex w-full h-full">
          {/* 3D 씬 - 남은 공간 */}
          <div className="flex-1 h-full" style={{ width: 'calc(100% - 50vh)' }}>
            <ThreeScene 
              onSceneManagerReady={handleSceneManagerReady}
              roomParams={roomParams}
            />
          </div>
          
          {/* 컨트롤 UI - 높이의 1/2 넓이 */}
          <div className="h-full" style={{ width: '50vh' }}>
            <ControlsContainer
              sceneManager={sceneManager}
              roomParams={roomParams}
              onRoomParamsChange={handleRoomParamsChange}
            />
          </div>
        </div>
      ) : (
        // 세로 모드: 상하로 50%씩 배치
        <div className="flex flex-col w-full h-full">
          {/* 3D 씬 - 위쪽 50% */}


          <div className="w-full h-1/2 z-1">
            <ThreeScene 
              onSceneManagerReady={handleSceneManagerReady}
              roomParams={roomParams}
            />
          </div>
          
          {/* 컨트롤 UI - 아래쪽 50% */}
          <div className="w-full h-1/2 z-10">
            <ControlsContainer
              sceneManager={sceneManager}
              roomParams={roomParams}
              onRoomParamsChange={handleRoomParamsChange}
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Scene 