'use client'

import { useEffect, useRef } from 'react'
import { SceneManager } from './threejs/SceneManager'

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

  return <div ref={containerRef} className="w-full h-full" />
} 