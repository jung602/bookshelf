import { useState, useEffect, useCallback } from 'react'

// 반응형 breakpoints 정의
export const BREAKPOINTS = {
  mobile: 450,   // iPhone, 갤럭시 등 모바일 기기
  tablet: 1024,  // 태블릿 (세로 768px 포함)
  desktop: 1280  // 데스크탑
} as const

// 디바이스 타입
export type DeviceType = 'mobile' | 'tablet' | 'desktop'

// 화면 방향
export type Orientation = 'portrait' | 'landscape'

// 반응형 상태 인터페이스
export interface ResponsiveState {
  width: number
  height: number
  deviceType: DeviceType
  orientation: Orientation
  isMobile: boolean
  isTablet: boolean
  isDesktop: boolean
  isPortrait: boolean
  isLandscape: boolean
}

/**
 * UI 반응형을 위한 hook
 * 모바일, 태블릿, 데스크탑을 구분하고 화면 방향을 감지합니다.
 */
export function useResponsiveDevice(): ResponsiveState {
  // 초기 상태 설정
  const getInitialState = useCallback((): ResponsiveState => {
    if (typeof window === 'undefined') {
      return {
        width: 0,
        height: 0,
        deviceType: 'desktop',
        orientation: 'landscape',
        isMobile: false,
        isTablet: false,
        isDesktop: true,
        isPortrait: false,
        isLandscape: true
      }
    }

    const width = window.innerWidth
    const height = window.innerHeight
    
    // 디바이스 타입 결정
    const deviceType: DeviceType = 
      width < BREAKPOINTS.mobile ? 'mobile' :
      width < BREAKPOINTS.tablet ? 'tablet' : 'desktop'
    
    // 화면 방향 결정
    const orientation: Orientation = width > height ? 'landscape' : 'portrait'

    return {
      width,
      height,
      deviceType,
      orientation,
      isMobile: deviceType === 'mobile',
      isTablet: deviceType === 'tablet',
      isDesktop: deviceType === 'desktop',
      isPortrait: orientation === 'portrait',
      isLandscape: orientation === 'landscape'
    }
  }, [])

  const [state, setState] = useState<ResponsiveState>(getInitialState)

  // resize 이벤트 핸들러 (디바운싱 적용)
  useEffect(() => {
    if (typeof window === 'undefined') return

    let timeoutId: NodeJS.Timeout

    const handleResize = () => {
      // 디바운싱: 100ms 후에 상태 업데이트
      clearTimeout(timeoutId)
      timeoutId = setTimeout(() => {
        setState(getInitialState())
      }, 100)
    }

    // 이벤트 리스너 등록
    window.addEventListener('resize', handleResize, { passive: true })

    // 초기 상태 설정
    setState(getInitialState())

    // 클린업
    return () => {
      window.removeEventListener('resize', handleResize)
      clearTimeout(timeoutId)
    }
  }, [getInitialState])

  return state
} 