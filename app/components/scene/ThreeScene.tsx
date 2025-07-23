'use client'

import { useEffect, useRef, useState } from 'react'
import { SceneManager, RoomParams } from './3d/SceneManager'
import { GizmoState } from './3d/managers/InteractionManager'
import { ModelGizmo } from './3d/managers/ModelGizmo'
import { useResponsiveScene } from '../../hooks/useResponsiveScene'

interface ThreeSceneProps {
  onSceneManagerReady?: (sceneManager: SceneManager) => void
  roomParams: RoomParams
  onRoomParamsChange?: (params: RoomParams) => void
}

export default function ThreeScene({ onSceneManagerReady, roomParams }: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null)
  const [gizmoState, setGizmoState] = useState<GizmoState>({ selectedModelId: null, screenPosition: null })
  const modelGizmoRef = useRef<ModelGizmo | null>(null)

  // 반응형 씬 설정 (frustumSize 기반)
  const responsiveConfig = {
    baseFrustumSize: 10, // 기본 frustumSize
    animationSpeed: 0.12 // 부드러운 애니메이션을 위한 속도 (0.01-1)
  }

  // SceneManager가 생성된 후에 useResponsiveScene 훅 사용
  const { forceUpdate } = useResponsiveScene(
    sceneManager,
    responsiveConfig
  )

  useEffect(() => {
    if (!containerRef.current) return

    console.log('ThreeScene: Initializing SceneManager...')

    // Three.js 씬 매니저 초기화
    const newSceneManager = new SceneManager(
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

    sceneManagerRef.current = newSceneManager
    setSceneManager(newSceneManager)

    // 기본 룸으로 초기화
    newSceneManager.updateRoom(roomParams)
    
    // 부모 컴포넌트에 SceneManager 전달
    onSceneManagerReady?.(newSceneManager)

    console.log('ThreeScene: SceneManager initialized')
    
    return () => {
      // 정리
      console.log('ThreeScene: Disposing SceneManager...')
      sceneManagerRef.current?.dispose()
      sceneManagerRef.current = null
      setSceneManager(null)
    }
  }, []) // roomParams 의존성 제거 - 컴포넌트 마운트 시에만 생성

  // roomParams가 변경될 때 씬 업데이트
  useEffect(() => {
    if (sceneManagerRef.current) {
      sceneManagerRef.current.updateRoom(roomParams)
    }
  }, [roomParams])

  // SceneManager가 생성된 후 초기 리사이즈 호출 (한 번만)
  useEffect(() => {
    if (sceneManager && forceUpdate) {
      console.log('ThreeScene: Calling initial resize...')
      const timeoutId = setTimeout(() => {
        forceUpdate()
      }, 100)
      
      return () => clearTimeout(timeoutId)
    }
  }, [sceneManager, forceUpdate])

  // ModelGizmo 초기화 (컴포넌트 마운트 시 한 번만)
  useEffect(() => {
    modelGizmoRef.current = new ModelGizmo({
      modelId: null,
      position: null,
      onRotate: handleModelRotate,
      onDelete: handleModelDelete,
      onClose: handleGizmoClose
    })

    // 컴포넌트 언마운트 시 기즈모 정리
    return () => {
      if (modelGizmoRef.current) {
        modelGizmoRef.current.dispose()
        modelGizmoRef.current = null
      }
    }
  }, [])

  // ModelGizmo 상태 업데이트 (gizmoState 변경 시)
  useEffect(() => {
    if (modelGizmoRef.current) {
      modelGizmoRef.current.updateProps({
        modelId: gizmoState.selectedModelId,
        position: gizmoState.screenPosition,
        onRotate: handleModelRotate,
        onDelete: handleModelDelete,
        onClose: handleGizmoClose
      })
    }
  }, [gizmoState])



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
    <div ref={containerRef} className="w-full h-full" />
  )
} 