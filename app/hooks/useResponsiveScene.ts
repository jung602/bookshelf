import { useState, useEffect, useCallback, useRef } from 'react'
import { SceneManager } from '../components/scene/3d/SceneManager'

interface ResponsiveConfig {
  baseFrustumSize: number
  animationSpeed: number
}

// 모바일 감지 함수
const getDefaultBaseFrustumSize = (): number => {
  if (typeof window === 'undefined') return 10
  const isMobile = window.innerWidth < 450
  return isMobile ? 7 : 10 // 모바일에서 줌인
}

const DEFAULT_CONFIG: ResponsiveConfig = {
  baseFrustumSize: getDefaultBaseFrustumSize(),
  animationSpeed: 0.15
}

/**
 * 브라우저 화면 크기에 따라 씬과 카메라 frustumSize를 조절하는 훅
 * @param sceneManager - 씬 매니저 인스턴스
 * @param config - 반응형 설정
 */
export function useResponsiveScene(
  sceneManager: SceneManager | null,
  config: Partial<ResponsiveConfig> = {}
) {
  const configRef = useRef<ResponsiveConfig>({ ...DEFAULT_CONFIG, ...config })
  const [viewportSize, setViewportSize] = useState<{ width: number; height: number }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0
  })
  
  const lastSizeRef = useRef<{ width: number; height: number }>({ width: 0, height: 0 })
  const resizeTimeoutRef = useRef<number | undefined>(undefined)
  const prevFrustumSizeRef = useRef<number>(configRef.current.baseFrustumSize)

  // 현재 브라우저가 가로 모드인지 확인
  const isLandscape = viewportSize.width > viewportSize.height

  // 실제 3D 씬이 차지하는 영역 크기 계산
  const getSceneAreaSize = useCallback(() => {
    const { width, height } = viewportSize
    
    if (isLandscape) {
      // 가로 모드: 3D 씬이 왼쪽 50% 차지
      return { width: width / 2, height }
    } else {
      // 세로 모드: 3D 씬이 위쪽 50% 차지
      return { width, height: height / 2 }
    }
  }, [viewportSize, isLandscape])

  // 브라우저 크기에 따른 frustumSize 계산 (실제 3D 씬 영역 기준)
  const calculateFrustumSize = useCallback((): number => {
    const { baseFrustumSize } = configRef.current
    const sceneArea = getSceneAreaSize()
    const effectiveWidth = Math.min(sceneArea.width, sceneArea.height * 1.5) // 가로세로 비율 고려
    
    // 모바일 감지 (450px 이하)
    const isMobile = viewportSize.width < 450

    // 실제 3D 씬 영역 크기에 따라 frustumSize 조절
    if (effectiveWidth > 720) {
      return baseFrustumSize * 0.8;      // 큰 3D 씬 영역 - 더 좁은 시야 (줌인)
    } else if (effectiveWidth > 512) {
      return baseFrustumSize * 0.9;      // 중간 3D 씬 영역 - 약간 좁은 시야
    } else if (effectiveWidth > 384) {
      return baseFrustumSize * 1.0;      // 기본 3D 씬 영역 - 기본 시야
    } else if (effectiveWidth > 240) {
      // 모바일에서는 줌인 (frustumSize를 줄임)
      return baseFrustumSize * (isMobile ? 1 : 1.3);      // 작은 3D 씬 영역
    } else {
      // 모바일에서는 더 줌인
      return baseFrustumSize * (isMobile ? 1.2 : 1.5);      // 매우 작은 3D 씬 영역
    }
  }, [getSceneAreaSize, configRef, viewportSize.width])

  // 실제 사용 가능한 크기 가져오기
  const getActualSize = useCallback(() => {
    // sceneManager의 container 크기를 우선 사용 (이미 레이아웃에 맞게 조정된 크기)
    if (sceneManager && (sceneManager as unknown as { container: HTMLElement }).container) {
      const container = (sceneManager as unknown as { container: HTMLElement }).container
      const rect = container.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        return { width: rect.width, height: rect.height }
      }
    }
    
    // fallback to calculated scene area size
    return getSceneAreaSize()
  }, [sceneManager, getSceneAreaSize])

  // 씬 크기 및 frustumSize 업데이트 함수
  const updateScene = useCallback((width?: number, height?: number) => {
    if (!sceneManager) {
      return
    }

    const actualSize = width && height ? { width, height } : getActualSize()
    const newFrustumSize = calculateFrustumSize()
    
    // 크기가 변경되었거나 frustumSize가 변경된 경우에만 업데이트
    const sizeChanged = lastSizeRef.current.width !== actualSize.width || 
                       lastSizeRef.current.height !== actualSize.height
    const frustumChanged = Math.abs(prevFrustumSizeRef.current - newFrustumSize) > 0.01

    if (!sizeChanged && !frustumChanged) {
      return
    }


    
    lastSizeRef.current = actualSize
    prevFrustumSizeRef.current = newFrustumSize

    // SceneManager 업데이트
    sceneManager.updateSizeAndFrustum(actualSize.width, actualSize.height, newFrustumSize)
  }, [sceneManager, getActualSize, calculateFrustumSize])

  // 브라우저 리사이즈 이벤트 핸들러
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setViewportSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }

    // 리사이즈 이벤트 리스너 등록
    window.addEventListener('resize', handleResize, { passive: true })
    
    // 초기 사이즈 설정
    handleResize()
    
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  // 디바운스된 업데이트 핸들러
  const debouncedUpdate = useCallback(() => {
    if (resizeTimeoutRef.current) {
      clearTimeout(resizeTimeoutRef.current)
    }

    resizeTimeoutRef.current = window.setTimeout(() => {
      updateScene()
    }, 100) // 100ms 디바운스
  }, [updateScene])

  // 뷰포트 크기가 변경될 때 업데이트
  useEffect(() => {
    debouncedUpdate()
  }, [viewportSize, debouncedUpdate])

  // SceneManager 변경 시 설정
  useEffect(() => {
    if (!sceneManager) {
      return
    }



    // 애니메이션 속도 설정
    sceneManager.setResizeAnimationSpeed(configRef.current.animationSpeed)

    // 초기 업데이트
    setTimeout(() => {
      updateScene()
    }, 50)

    return () => {
      if (resizeTimeoutRef.current) {
        clearTimeout(resizeTimeoutRef.current)
      }
    }
  }, [sceneManager, updateScene])

  // 설정 업데이트 함수
  const updateConfig = useCallback((newConfig: Partial<ResponsiveConfig>) => {
    configRef.current = { ...configRef.current, ...newConfig }
    
    if (sceneManager && newConfig.animationSpeed !== undefined) {
      sceneManager.setResizeAnimationSpeed(newConfig.animationSpeed)
    }

    // frustumSize 관련 설정이 변경되면 즉시 업데이트
    if (newConfig.baseFrustumSize !== undefined) {
      updateScene()
    }
  }, [sceneManager, updateScene])

  // forceUpdate 함수를 useCallback으로 메모이제이션하여 불필요한 재생성 방지
  const forceUpdate = useCallback(() => {
    updateScene()
  }, [updateScene])

  return {
    viewportSize,
    sceneAreaSize: getSceneAreaSize(),
    isLandscape,
    currentFrustumSize: calculateFrustumSize(),
    updateConfig,
    currentConfig: configRef.current,
    forceUpdate
  }
} 