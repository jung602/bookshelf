import { useState, useEffect, useCallback, useRef } from 'react'
import { SceneManager } from '../components/scene/3d/SceneManager'

interface ResponsiveConfig {
  baseFrustumSize: number
  animationSpeed: number
}

const DEFAULT_CONFIG: ResponsiveConfig = {
  baseFrustumSize: 10,
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

  // 브라우저 크기에 따른 frustumSize 계산 (useModelScale.ts 로직 참고)
  const calculateFrustumSize = useCallback((): number => {
    const { baseFrustumSize } = configRef.current
    const { width } = viewportSize

    // 화면 크기에 따라 frustumSize 조절 (작은 화면일수록 더 큰 frustumSize로 줌아웃)
    if (width > 1440) {
      return baseFrustumSize * 0.8;      // 데스크탑 큰 화면 - 더 좁은 시야 (줌인)
    } else if (width > 1024) {
      return baseFrustumSize * 0.9;      // 데스크탑 - 약간 좁은 시야
    } else if (width > 768) {
      return baseFrustumSize * 1.0;      // 태블릿 - 기본 시야
    } else if (width > 480) {
      return baseFrustumSize * 1.3;      // 큰 모바일 - 넓은 시야 (줌아웃)
    } else {
      return baseFrustumSize * 1.5;      // 작은 모바일 - 더 넓은 시야 (더 줌아웃)
    }
  }, [viewportSize, configRef])

  // 실제 사용 가능한 크기 가져오기
  const getActualSize = useCallback(() => {
    // sceneManager의 container 크기를 우선 사용
    if (sceneManager && (sceneManager as any).container) {
      const container = (sceneManager as any).container as HTMLElement
      const rect = container.getBoundingClientRect()
      if (rect.width > 0 && rect.height > 0) {
        return { width: rect.width, height: rect.height }
      }
    }
    
    // fallback to viewport size
    return viewportSize
  }, [sceneManager, viewportSize])

  // 씬 크기 및 frustumSize 업데이트 함수
  const updateScene = useCallback((width?: number, height?: number) => {
    if (!sceneManager) {
      console.log('useResponsiveScene: SceneManager is null, skipping update')
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

    console.log(`useResponsiveScene: Updating scene - Size: ${actualSize.width}x${actualSize.height}, FrustumSize: ${newFrustumSize.toFixed(2)}`)
    
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

    console.log('useResponsiveScene: Setting up with SceneManager')

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

  return {
    viewportSize,
    currentFrustumSize: calculateFrustumSize(),
    updateConfig,
    currentConfig: configRef.current,
    forceUpdate: () => {
      console.log('useResponsiveScene: Force update called')
      updateScene()
    }
  }
} 