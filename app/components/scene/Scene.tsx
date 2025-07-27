'use client'

import { useState, useEffect } from 'react'
import ThreeScene from './ThreeScene'
import ControlsContainer from './3d/controls/ControlsContainer'
import { TopBar } from './3d/controls'
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
  
  // 모바일 접기/펴기 상태
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false)

  // 다크모드 상태 - 초기값을 시스템 다크모드로 설정
  const [isDarkMode, setIsDarkMode] = useState(() => {
    // SSR 환경에서는 기본값 false 반환
    if (typeof window === 'undefined') {
      return false
    }
    // 클라이언트에서는 시스템 다크모드 상태를 즉시 확인
    return window.matchMedia('(prefers-color-scheme: dark)').matches
  })

  // SceneManager가 준비되었을 때 호출
  const handleSceneManagerReady = (newSceneManager: SceneManager) => {
    setSceneManager(newSceneManager)
  }

  // 룸 파라미터 변경 핸들러
  const handleRoomParamsChange = (newParams: RoomParams) => {
    setRoomParams(newParams)
  }

  // 접기/펴기 토글 핸들러
  const toggleCollapse = () => {
    setIsCollapsed(!isCollapsed)
  }

  // 시스템 다크모드 감지
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    
    // 초기 다크모드 상태 설정
    setIsDarkMode(mediaQuery.matches)
    
    // 다크모드 변경 리스너
    const handleDarkModeChange = (e: MediaQueryListEvent) => {
      setIsDarkMode(e.matches)
    }
    
    mediaQuery.addEventListener('change', handleDarkModeChange)
    
    return () => {
      mediaQuery.removeEventListener('change', handleDarkModeChange)
    }
  }, [])

  // isDarkMode 상태에 따라 HTML 요소에 dark 클래스 토글
  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [isDarkMode])

  // 모바일에서 동적 높이 계산
  useEffect(() => {
    const calculateHeights = () => {
      if (isMobile) {
        const browserWidth = window.innerWidth
        const browserHeight = window.innerHeight
        
        // 접혔을 때는 42px만, 펼쳤을 때는 브라우저 너비 + 42px
        const controlsUIHeight = isCollapsed ? 36 : browserWidth + 36
        
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
  }, [isMobile, isCollapsed]) // isCollapsed 의존성 추가

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
            ? "w-full flex flex-col" 
            : "fixed bottom-[12px] left-1/2 transform -translate-x-1/2 z-50 min-w-[402px]"
          }
          style={isMobile ? { height: `${controlsHeight}px` } : {}}
        >
          {/* 상단 바 - 모바일에서 접기/펴기 버튼 포함 */}
          <TopBar 
            isMobile={isMobile}
            isCollapsed={isCollapsed}
            onToggleCollapse={toggleCollapse}
            isDarkMode={isDarkMode}
          />
          
          {/* 컨트롤 컨테이너 - 접혔을 때는 숨김 */}
          {(!isMobile || !isCollapsed) && (
            <ControlsContainer
              sceneManager={sceneManager}
              roomParams={roomParams}
              onRoomParamsChange={handleRoomParamsChange}
              isDarkMode={isDarkMode}
            />
          )}
        </div>
      </div>
    </div>
  )
}

export default Scene 