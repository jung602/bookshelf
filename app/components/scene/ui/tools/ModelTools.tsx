'use client'

import { useState, useRef, useEffect } from 'react'

// 사용 가능한 모델 타입 정의
export interface ModelType {
  id: string
  name: string
  description: string
  icon: string
}

// 사용 가능한 모델들
const AVAILABLE_MODELS: ModelType[] = [
  {
    id: 'audio',
    name: '오디오 시스템',
    description: '회전하는 오디오 스피커 모델',
    icon: '🔊'
  }
  // 추후 다른 모델들을 여기에 추가할 수 있습니다
]

interface ModelToolsProps {
  onModelAdd: (modelType: string) => void
}

export default function ModelTools({ onModelAdd }: ModelToolsProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  // 드롭다운 외부 클릭 시 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleModelSelect = (modelId: string) => {
    onModelAdd(modelId)
    setIsDropdownOpen(false)
  }

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      {/* 모델 추가 버튼 */}
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '10px 16px',
          backgroundColor: '#3b82f6',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '14px',
          fontWeight: '500',
          cursor: 'pointer',
          transition: 'all 0.2s',
          boxShadow: '0 2px 4px rgba(59, 130, 246, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.backgroundColor = '#2563eb'
          e.currentTarget.style.transform = 'translateY(-1px)'
          e.currentTarget.style.boxShadow = '0 4px 8px rgba(59, 130, 246, 0.3)'
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.backgroundColor = '#3b82f6'
          e.currentTarget.style.transform = 'translateY(0)'
          e.currentTarget.style.boxShadow = '0 2px 4px rgba(59, 130, 246, 0.2)'
        }}
      >
        <span>📦</span>
        <span>모델 추가</span>
        <span style={{
          transform: isDropdownOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          transition: 'transform 0.2s'
        }}>
          ▼
        </span>
      </button>

      {/* 드롭다운 메뉴 */}
      {isDropdownOpen && (
        <div style={{
          position: 'absolute',
          top: '100%',
          left: '0',
          marginTop: '8px',
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          border: '1px solid #e5e7eb',
          minWidth: '200px',
          zIndex: 100,
          overflow: 'hidden'
        }}>
          {AVAILABLE_MODELS.map((model) => (
            <button
              key={model.id}
              onClick={() => handleModelSelect(model.id)}
              style={{
                width: '100%',
                padding: '12px 16px',
                border: 'none',
                backgroundColor: 'transparent',
                textAlign: 'left',
                cursor: 'pointer',
                transition: 'background-color 0.2s',
                borderBottom: '1px solid #f3f4f6'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#f9fafb'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = 'transparent'
              }}
            >
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px'
              }}>
                <span style={{ fontSize: '20px' }}>{model.icon}</span>
                <div>
                  <div style={{
                    fontSize: '14px',
                    fontWeight: '500',
                    color: '#374151',
                    marginBottom: '2px'
                  }}>
                    {model.name}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: '#6b7280'
                  }}>
                    {model.description}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  )
} 