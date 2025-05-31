'use client'

import { useEffect, useRef } from 'react'
import { SceneManager } from './3d/SceneManager'
import ColorToolbar from './ColorToolbar'

export default function ThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    // Three.js 씬 매니저 초기화
    sceneManagerRef.current = new SceneManager(containerRef.current)
    
    return () => {
      // 정리
      sceneManagerRef.current?.dispose()
      sceneManagerRef.current = null
    }
  }, [])

  const handleWallColorChange = (color: string) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.getColorControls().updateWallColor(color)
    }
  }

  const handleFloorColorChange = (color: string) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.getColorControls().updateFloorColor(color)
    }
  }

  return (
    <>
      <div ref={containerRef} className="w-full h-full" />
      <ColorToolbar
        onWallColorChange={handleWallColorChange}
        onFloorColorChange={handleFloorColorChange}
      />
    </>
  )
} 