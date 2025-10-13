'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { SceneManager, RoomParams } from './3d/SceneManager'
import { ModelGizmo } from './3d/managers/ModelGizmo'
import type { GizmoState } from './3d/managers/InteractionManager'
import { useResponsiveScene } from '../../hooks/useResponsiveScene'

// 전역 플래그로 SceneManager 중복 생성 방지
let globalSceneManagerInstance: SceneManager | null = null
let isInitializingSceneManager = false

// 깊은 비교 함수
function deepEqual(obj1: unknown, obj2: unknown): boolean {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return false;
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual((obj1 as Record<string, unknown>)[key], (obj2 as Record<string, unknown>)[key])) return false;
  }
  
  return true;
}

interface ThreeSceneProps {
  onSceneManagerReady: (sceneManager: SceneManager) => void
  roomParams: RoomParams
}

export default function ThreeScene({ onSceneManagerReady, roomParams }: ThreeSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const sceneManagerRef = useRef<SceneManager | null>(null)
  const modelGizmoRef = useRef<ModelGizmo | null>(null)
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null)
  const previousRoomParamsRef = useRef<RoomParams>(roomParams)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  // 반응형 씬 설정 (frustumSize 기반)
  // baseFrustumSize는 useResponsiveScene에서 자동으로 모바일 감지
  const responsiveConfig = {
    animationSpeed: 0.12 // 부드러운 애니메이션을 위한 속도 (0.01-1)
  }

  // 기즈모 상태 변경 핸들러
  const handleGizmoStateChange = useCallback((gizmoState: GizmoState) => {
    
    if (!modelGizmoRef.current && sceneManagerRef.current) {
      // ModelGizmo 인스턴스 생성
      modelGizmoRef.current = new ModelGizmo({
        modelId: gizmoState.selectedModelId,
        position: gizmoState.screenPosition,
        onRotate: (modelId: string) => {
          
          if (sceneManagerRef.current) {
            sceneManagerRef.current.rotateModel(modelId)
          }
        },
        onDelete: async (modelId: string) => {
          
          if (sceneManagerRef.current) {
            try {
              await sceneManagerRef.current.deleteModel(modelId)
            } catch (error) {
              console.error('Failed to delete model:', error)
            }
          }
        },
        onClose: () => {
          
          // 기즈모를 숨기기 위해 빈 상태로 업데이트
          if (modelGizmoRef.current) {
            modelGizmoRef.current.updateProps({
              modelId: null,
              position: null,
              onRotate: () => {},
              onDelete: () => {},
              onClose: () => {}
            })
          }
        }
      })
    } else if (modelGizmoRef.current) {
      // 기존 ModelGizmo 인스턴스 업데이트
      modelGizmoRef.current.updateProps({
        modelId: gizmoState.selectedModelId,
        position: gizmoState.screenPosition,
        onRotate: (modelId: string) => {
          
          if (sceneManagerRef.current) {
            sceneManagerRef.current.rotateModel(modelId)
          }
        },
        onDelete: async (modelId: string) => {
          
          if (sceneManagerRef.current) {
            try {
              await sceneManagerRef.current.deleteModel(modelId)
            } catch (error) {
              console.error('Failed to delete model:', error)
            }
          }
        },
        onClose: () => {
          
          // 기즈모를 숨기기 위해 빈 상태로 업데이트
          if (modelGizmoRef.current) {
            modelGizmoRef.current.updateProps({
              modelId: null,
              position: null,
              onRotate: () => {},
              onDelete: () => {},
              onClose: () => {}
            })
          }
        }
      })
    }
  }, [])

  // SceneManager가 생성된 후에 useResponsiveScene 훅 사용
  const { forceUpdate } = useResponsiveScene(sceneManager, responsiveConfig)

  // roomParams 업데이트 함수를 useCallback으로 메모화
  const updateRoomParams = useCallback(() => {
    if (sceneManagerRef.current && !deepEqual(previousRoomParamsRef.current, roomParams)) {

      sceneManagerRef.current.updateRoom(roomParams);
      previousRoomParamsRef.current = roomParams;
    }
  }, [roomParams])

  // Container 크기 변화 감지 및 3D 씬 업데이트
  useEffect(() => {
    if (!containerRef.current || !sceneManager) return

    const container = containerRef.current

    // ResizeObserver로 container 크기 변화 감지
    resizeObserverRef.current = new ResizeObserver(() => {
      // forceUpdate 호출하여 3D 씬 크기 업데이트
      if (forceUpdate) {
        forceUpdate()
      }
    })

    resizeObserverRef.current.observe(container)

    return () => {
      if (resizeObserverRef.current) {
        resizeObserverRef.current.disconnect()
        resizeObserverRef.current = null
      }
    }
  }, [sceneManager, forceUpdate])

  // SceneManager 초기화 (한 번만 실행)
  useEffect(() => {
    if (!containerRef.current) return
    
    // 이미 초기화 중이거나 완료된 경우 건너뛰기
    if (isInitializingSceneManager || globalSceneManagerInstance) {

      if (globalSceneManagerInstance && !sceneManagerRef.current) {
        sceneManagerRef.current = globalSceneManagerInstance
        setSceneManager(globalSceneManagerInstance)
        onSceneManagerReady(globalSceneManagerInstance)
      }
      return
    }


    isInitializingSceneManager = true

    try {
      const newSceneManager = new SceneManager(
        containerRef.current,
        handleGizmoStateChange
      )
      
      // 전역 인스턴스 설정
      globalSceneManagerInstance = newSceneManager
      sceneManagerRef.current = newSceneManager
      setSceneManager(newSceneManager)
      
      // 현재 roomParams로 초기화
      newSceneManager.updateRoom(roomParams)
      
      onSceneManagerReady(newSceneManager)
      // 초기 리사이즈 호출
      setTimeout(() => {
        if (forceUpdate) forceUpdate()
      }, 100)
      
    } catch (error) {
      console.error('ThreeScene: Failed to initialize SceneManager:', error)
    } finally {
      isInitializingSceneManager = false
    }

    // 클린업 함수 - 컴포넌트가 실제로 언마운트될 때만 실행
    return () => {
      // StrictMode의 의도적인 클린업인지 확인
      const isStrictModeCleanup = sceneManagerRef.current === globalSceneManagerInstance
      
      if (isStrictModeCleanup) {

        return // StrictMode 클린업은 무시
      }
      

      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose()
        sceneManagerRef.current = null
        setSceneManager(null)
      }
      
      // ModelGizmo 정리
      if (modelGizmoRef.current) {
        modelGizmoRef.current.dispose()
        modelGizmoRef.current = null
      }
      
      // 전역 인스턴스도 정리
      if (globalSceneManagerInstance) {
        globalSceneManagerInstance = null
      }
      
      isInitializingSceneManager = false
    }
  }, [onSceneManagerReady, roomParams, forceUpdate, handleGizmoStateChange])

  // roomParams가 변경될 때 씬 업데이트
  useEffect(() => {
    updateRoomParams()
  }, [updateRoomParams])

  return <div ref={containerRef} className="w-full h-full" />
} 