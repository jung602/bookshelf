'use client'

import { useState, useEffect } from 'react'

interface ModelGizmoProps {
  modelId: string | null
  position: { x: number; y: number } | null
  onRotate: (modelId: string) => void
  onDelete: (modelId: string) => void
  onClose: () => void
}

export default function ModelGizmo({
  modelId,
  position,
  onRotate,
  onDelete,
  onClose
}: ModelGizmoProps) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    console.log('ModelGizmo props changed:', { modelId, position })
    
    if (modelId && position) {
      console.log('Setting gizmo visible')
      setIsVisible(true)
    } else {
      console.log('Setting gizmo hidden')
      setIsVisible(false)
    }
  }, [modelId, position])

  // OrbitControls나 드래그 시 기즈모 닫기
  useEffect(() => {
    if (!isVisible) return

    const handleMouseDown = (e: MouseEvent) => {
      // 기즈모 영역 클릭이 아닌 경우에만 닫기
      const target = e.target as HTMLElement
      const gizmoElement = document.querySelector('[data-gizmo="true"]')
      
      if (gizmoElement && !gizmoElement.contains(target)) {
        onClose()
      }
    }

    const handleMouseMove = (e: MouseEvent) => {
      // 마우스 버튼이 눌린 상태에서 움직이면 (드래그나 OrbitControls) 기즈모 닫기
      if (e.buttons > 0) {
        onClose()
      }
    }

    const handleWheel = () => {
      // 휠 이벤트 발생 시 (줌인/줌아웃) 기즈모 닫기
      onClose()
    }

    // 터치 이벤트 처리 추가
    const handleTouchStart = (e: TouchEvent) => {
      // 기즈모 영역 터치가 아닌 경우에만 닫기
      const target = e.target as HTMLElement
      const gizmoElement = document.querySelector('[data-gizmo="true"]')
      
      if (gizmoElement && !gizmoElement.contains(target)) {
        onClose()
      }
    }

    const handleTouchMove = (e: TouchEvent) => {
      // 터치 이동 시 기즈모 닫기
      onClose()
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('mousemove', handleMouseMove)
    document.addEventListener('wheel', handleWheel)
    document.addEventListener('touchstart', handleTouchStart)
    document.addEventListener('touchmove', handleTouchMove)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('wheel', handleWheel)
      document.removeEventListener('touchstart', handleTouchStart)
      document.removeEventListener('touchmove', handleTouchMove)
    }
  }, [isVisible, onClose])

  console.log('ModelGizmo render:', { isVisible, modelId, position })

  if (!isVisible || !modelId || !position) {
    return null
  }

  const handleRotate = () => {
    onRotate(modelId)
  }

  const handleDelete = () => {
    onDelete(modelId)
    onClose()
  }

  return (
    <>
      {/* 배경 클릭 시 기즈모 닫기 - 이벤트가 통과하도록 수정 */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 40,
          backgroundColor: 'transparent',
          pointerEvents: 'none' // 이벤트가 통과하도록 설정
        }}
        onClick={onClose}
      />
      
      {/* 기즈모 UI */}
      <div
        style={{
          position: 'fixed',
          left: `${position.x}px`,
          top: `${position.y}px`,
          transform: 'translate(-50%, -100%)',
          zIndex: 50,
          pointerEvents: 'none' // 기본적으로 이벤트 통과
        }}
        data-gizmo="true"
      >
        <div style={{
          backgroundColor: 'rgba(255, 255, 255, 0.95)',
          backdropFilter: 'blur(8px)',
          borderRadius: '8px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
          border: '1px solid #e5e7eb',
          padding: '8px',
          display: 'flex',
          gap: '8px',
          alignItems: 'center',
          pointerEvents: 'auto' // 버튼 영역에서만 이벤트 처리
        }}>
          {/* 회전 버튼 */}
          <button
            onClick={handleRotate}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              border: '1px solid #d1d5db',
              backgroundColor: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '16px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
              e.currentTarget.style.borderColor = '#9ca3af'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#ffffff'
              e.currentTarget.style.borderColor = '#d1d5db'
            }}
            title="90도 회전"
          >
            🔄
          </button>

          {/* 삭제 버튼 */}
          <button
            onClick={handleDelete}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '6px',
              border: '1px solid #fca5a5',
              backgroundColor: '#fef2f2',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              transition: 'all 0.2s ease',
              fontSize: '16px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#fee2e2'
              e.currentTarget.style.borderColor = '#f87171'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#fef2f2'
              e.currentTarget.style.borderColor = '#fca5a5'
            }}
            title="삭제"
          >
            🗑️
          </button>
        </div>
        
        {/* 화살표 */}
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: '6px solid rgba(255, 255, 255, 0.95)',
          filter: 'drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1))',
          pointerEvents: 'none' // 화살표는 이벤트 통과
        }} />
      </div>
    </>
  )
} 