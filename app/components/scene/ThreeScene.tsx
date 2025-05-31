'use client'

import { useEffect, useRef, useState } from 'react'
import { SceneManager } from './3d/SceneManager'
import { GizmoState } from './3d/managers/InteractionManager'
import { getModelClass } from './3d/objects'
import { Book } from './3d/objects/book'
import Toolbar from './ui/Toolbar'
import ModelGizmo from './ui/ModelGizmo'

export default function ThreeScene() {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)
  const [gizmoState, setGizmoState] = useState<GizmoState>({ selectedModelId: null, screenPosition: null })

  useEffect(() => {
    if (!containerRef.current) return

    // Three.js 씬 매니저 초기화
    sceneManagerRef.current = new SceneManager(
      containerRef.current,
      (newGizmoState: GizmoState) => {
        console.log('ThreeScene received gizmo state change:', newGizmoState)
        // 새로운 객체로 복사하여 React가 변경을 감지할 수 있도록 함
        setGizmoState({
          selectedModelId: newGizmoState.selectedModelId,
          screenPosition: newGizmoState.screenPosition ? {
            x: newGizmoState.screenPosition.x,
            y: newGizmoState.screenPosition.y
          } : null
        })
      }
    )
    
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

  const handleBookCreate = async (imageUrl: string, thickness: number, aspectRatio: number) => {
    if (!sceneManagerRef.current) return

    try {
      const bookConfig = {
        imageUrl,
        thickness,
        aspectRatio
      }
      
      const book = new Book(bookConfig)
      await sceneManagerRef.current.getModelManager().addModel(book)
      console.log('Book created successfully')
    } catch (error) {
      console.error('Failed to create book:', error)
    }
  }

  const handleModelRotate = (modelId: string) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.rotateModel(modelId)
    }
  }

  const handleModelDelete = (modelId: string) => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.deleteModel(modelId)
    }
  }

  const handleGizmoClose = () => {
    setGizmoState({ selectedModelId: null, screenPosition: null })
  }

  return (
    <>
      <div ref={containerRef} className="w-full h-full" />
      <Toolbar
        onWallColorChange={handleWallColorChange}
        onFloorColorChange={handleFloorColorChange}
        onModelAdd={handleModelAdd}
        onBookCreate={handleBookCreate}
      />
      <ModelGizmo
        modelId={gizmoState.selectedModelId}
        position={gizmoState.screenPosition}
        onRotate={handleModelRotate}
        onDelete={handleModelDelete}
        onClose={handleGizmoClose}
      />
    </>
  )
} 