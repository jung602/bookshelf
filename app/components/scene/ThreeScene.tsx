'use client'

import { useEffect, useRef } from 'react'
import { SceneManager } from './3d/SceneManager'
import { getModelClass } from './3d/objects'
import Toolbar from './ui/Toolbar'

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

  const handleModelAdd = async (modelType: string) => {
    if (!sceneManagerRef.current) return

    try {
      // 동적으로 모델 클래스 가져오기
      const ModelClass = getModelClass(modelType)
      
      if (!ModelClass) {
        console.warn(`Unknown model type: ${modelType}`)
        return
      }

      const model = new ModelClass()
      await sceneManagerRef.current.getModelManager().addModel(model)
      console.log(`${modelType} model added successfully`)
    } catch (error) {
      console.error(`Failed to add ${modelType} model:`, error)
    }
  }

  return (
    <>
      <div ref={containerRef} className="w-full h-full" />
      <Toolbar
        onWallColorChange={handleWallColorChange}
        onFloorColorChange={handleFloorColorChange}
        onModelAdd={handleModelAdd}
      />
    </>
  )
} 