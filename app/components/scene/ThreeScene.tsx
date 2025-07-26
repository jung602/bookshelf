'use client'

import { useEffect, useRef, useState } from 'react'
import { SceneManager, RoomParams } from './3d/SceneManager'
import { GizmoState } from './3d/managers/InteractionManager'
import { ModelGizmo } from './3d/managers/ModelGizmo'
import { useResponsiveScene } from '../../hooks/useResponsiveScene'

// 전역 플래그로 SceneManager 중복 생성 방지
let globalSceneManagerInstance: SceneManager | null = null
let isInitializingSceneManager = false

// 깊은 비교 함수
function deepEqual(obj1: any, obj2: any): boolean {
  if (obj1 === obj2) return true;
  
  if (obj1 == null || obj2 == null) return false;
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object') return false;
  
  const keys1 = Object.keys(obj1);
  const keys2 = Object.keys(obj2);
  
  if (keys1.length !== keys2.length) return false;
  
  for (let key of keys1) {
    if (!keys2.includes(key)) return false;
    if (!deepEqual(obj1[key], obj2[key])) return false;
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
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null)
  const [gizmoState, setGizmoState] = useState<GizmoState>({ selectedModelId: null, screenPosition: null })
  const modelGizmoRef = useRef<ModelGizmo | null>(null)
  const previousRoomParamsRef = useRef<RoomParams>(roomParams)
  const resizeObserverRef = useRef<ResizeObserver | null>(null)

  // 반응형 씬 설정 (frustumSize 기반)
  const responsiveConfig = {
    baseFrustumSize: 10, // 기본 frustumSize
    animationSpeed: 0.12 // 부드러운 애니메이션을 위한 속도 (0.01-1)
  }

  // SceneManager가 생성된 후에 useResponsiveScene 훅 사용
  const { forceUpdate } = useResponsiveScene(sceneManager, responsiveConfig)

  // Container 크기 변화 감지 및 3D 씬 업데이트
  useEffect(() => {
    if (!containerRef.current || !sceneManager) return

    const container = containerRef.current

    // ResizeObserver로 container 크기 변화 감지
    resizeObserverRef.current = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect
        console.log(`ThreeScene: Container size changed to ${width}x${height}`)
        
        // forceUpdate 호출하여 3D 씬 크기 업데이트
        if (forceUpdate) {
          forceUpdate()
        }
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
      console.log('ThreeScene: Skipping initialization - already exists or in progress')
      if (globalSceneManagerInstance && !sceneManagerRef.current) {
        sceneManagerRef.current = globalSceneManagerInstance
        setSceneManager(globalSceneManagerInstance)
        onSceneManagerReady(globalSceneManagerInstance)
      }
      return
    }

    console.log('ThreeScene: Initializing SceneManager...')
    isInitializingSceneManager = true

    try {
      const newSceneManager = new SceneManager(
        containerRef.current,
        (newGizmoState: GizmoState) => {
          setGizmoState(newGizmoState)
        }
      )
      
      // 전역 인스턴스 설정
      globalSceneManagerInstance = newSceneManager
      sceneManagerRef.current = newSceneManager
      setSceneManager(newSceneManager)
      
      // 현재 roomParams로 초기화
      newSceneManager.updateRoom(roomParams)
      
      onSceneManagerReady(newSceneManager)
      console.log('ThreeScene: SceneManager initialized')
      
      // 초기 리사이즈 호출
      console.log('ThreeScene: Calling initial resize...')
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
        console.log('ThreeScene: Ignoring StrictMode cleanup')
        return // StrictMode 클린업은 무시
      }
      
      console.log('ThreeScene: Disposing SceneManager...')
      if (sceneManagerRef.current) {
        sceneManagerRef.current.dispose()
        sceneManagerRef.current = null
        setSceneManager(null)
      }
      
      // 전역 인스턴스도 정리
      if (globalSceneManagerInstance) {
        globalSceneManagerInstance = null
      }
      
      isInitializingSceneManager = false
    }
  }, []) // 빈 의존성 배열로 한 번만 실행

  // roomParams가 변경될 때 씬 업데이트 (깊은 비교로 불필요한 업데이트 방지)
  useEffect(() => {
    if (sceneManagerRef.current && !deepEqual(previousRoomParamsRef.current, roomParams)) {
      console.log('ThreeScene: Updating room with params:', roomParams);
      sceneManagerRef.current.updateRoom(roomParams);
      previousRoomParamsRef.current = roomParams;
    }
  }, [roomParams]);

  return <div ref={containerRef} className="w-full h-full" />
} 