'use client'

import { useState, useEffect } from 'react'
import { SceneManager, RoomParams } from '../SceneManager'
import FloorTileControl from './FloorTileControl'

interface ControlsContainerProps {
  sceneManager: SceneManager | null
  roomParams: RoomParams
  onRoomParamsChange: (params: RoomParams) => void
}

export default function ControlsContainer({
  sceneManager,
  roomParams,
  onRoomParamsChange
}: ControlsContainerProps) {
  console.log('ControlsContainer: Rendering with sceneManager:', !!sceneManager, 'roomParams:', roomParams);

  const [isDarkMode, setIsDarkMode] = useState(false)

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