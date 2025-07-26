'use client'

import { useState, useEffect, useRef } from 'react'
import { SceneManager, RoomParams } from '../SceneManager'
import FloorTileControl from './FloorTileControl'
import { useResponsiveDevice } from '../../../../hooks/useResponsiveDevice'

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
  const [squareSize, setSquareSize] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)
  const { isMobile } = useResponsiveDevice()

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

  // 컨테이너 크기 측정 및 정사각형 크기 계산 (모바일일 때만)
  useEffect(() => {
    if (!isMobile) return

    const updateSquareSize = () => {
      if (containerRef.current) {
        const { clientWidth, clientHeight } = containerRef.current
        const size = Math.min(clientWidth, clientHeight)
        setSquareSize(size)
        console.log('Mobile - Container size:', clientWidth, 'x', clientHeight, '-> Square size:', size)
      }
    }

    updateSquareSize()

    // 윈도우 리사이즈 시 재계산
    window.addEventListener('resize', updateSquareSize)
    
    return () => {
      window.removeEventListener('resize', updateSquareSize)
    }
  }, [isMobile])

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
    <div className="w-full h-full flex flex-col bg-[#f3f3f3]">
      <div className="w-full h-[42px] bg-[#D4D4D8] rounded-t-[30px]"></div>
      <div 
        ref={containerRef}
        className="w-full h-full flex items-center justify-center bg-[#D4D4D8]"
      >
        <div 
          className="flex items-center justify-center"
          style={isMobile ? {
            width: squareSize,
            height: squareSize,
          } : {
            width: '100%',
            height: '100%'
          }}
        >
          <FloorTileControl 
            isDarkMode={isDarkMode}
            onChange={handleFloorGridChange}
            initialGrid={roomParams.customGrid}
            sceneManager={sceneManager || undefined}
          />
        </div>
      </div>
    </div>
  )
} 