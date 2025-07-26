'use client'

import { useState, useEffect } from 'react'
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

  // 동적 높이 상태
  const [controlsHeight, setControlsHeight] = useState<number>(0)
  const [threeSceneHeight, setThreeSceneHeight] = useState<number>(0)

  // SceneManager가 준비되었을 때 호출
  const handleSceneManagerReady = (newSceneManager: SceneManager) => {
    setSceneManager(newSceneManager)
  }

  // 룸 파라미터 변경 핸들러
  const handleRoomParamsChange = (newParams: RoomParams) => {
    setRoomParams(newParams)
  }

  // 모바일에서 동적 높이 계산
  useEffect(() => {
    const calculateHeights = () => {
      if (isMobile) {
        const browserWidth = window.innerWidth
        const browserHeight = window.innerHeight
        
        // 컨트롤 UI 높이 = 브라우저 너비 + 42px (상단 둥근 부분)
        const controlsUIHeight = browserWidth + 42
        
        // ThreeScene 높이 = 전체 높이 - 컨트롤 UI 높이
        const threeSceneCalcHeight = browserHeight - controlsUIHeight
        
        setControlsHeight(controlsUIHeight)
        setThreeSceneHeight(threeSceneCalcHeight)
      }
    }

    // 초기 계산
    calculateHeights()

    // 리사이즈 이벤트 리스너 추가
    const handleResize = () => {
      calculateHeights()
    }

    window.addEventListener('resize', handleResize)
    
    // 클린업
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [isMobile])

  return (
    <div className="w-full h-full relative bg-gradient-to-br from-gray-50 to-gray-100">
      <div className={isMobile ? "flex flex-col w-full h-full" : "w-full h-full"}>
        {/* 3D 씬 - 모바일에서는 동적 높이, 나머지에서는 전체 화면 */}
        <div 
          className={isMobile ? "w-full" : "w-full h-full"}
          style={isMobile ? { height: `${threeSceneHeight}px` } : {}}
        >
          <ThreeScene 
            onSceneManagerReady={handleSceneManagerReady}
            roomParams={roomParams}
          />
        </div>
        
        {/* 컨트롤 UI - 모바일에서는 동적 높이, 나머지에서는 하단 고정 */}
        <div 
          className={isMobile 
            ? "w-full flex flex-col bg-[#f3f3f3]" 
            : "fixed bottom-[80px] left-1/2 transform -translate-x-1/2 z-50"
          }
          style={isMobile ? { height: `${controlsHeight}px` } : {}}
        >
          <div className="w-full h-[42px] bg-[#D4D4D8] rounded-t-[30px]"></div>
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