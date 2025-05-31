'use client'

import { useState } from 'react'

interface ColorToolbarProps {
  onWallColorChange: (color: string) => void
  onFloorColorChange: (color: string) => void
  initialWallColor?: string
  initialFloorColor?: string
}

export default function ColorToolbar({
  onWallColorChange,
  onFloorColorChange,
  initialWallColor = '#cccccc',
  initialFloorColor = '#ffffff'
}: ColorToolbarProps) {
  const [wallColor, setWallColor] = useState(initialWallColor)
  const [floorColor, setFloorColor] = useState(initialFloorColor)

  const handleWallColorChange = (color: string) => {
    setWallColor(color)
    onWallColorChange(color)
  }

  const handleFloorColorChange = (color: string) => {
    setFloorColor(color)
    onFloorColorChange(color)
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '24px',
      left: '50%',
      transform: 'translateX(-50%)',
      zIndex: 50
    }}>
      <div style={{
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        backdropFilter: 'blur(8px)',
        borderRadius: '8px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        padding: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          {/* 벽 색상 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              벽 색상
            </label>
            <div>
              <input
                type="color"
                value={wallColor}
                onChange={(e) => handleWallColorChange(e.target.value)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  border: '2px solid #d1d5db',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
                title="벽 색상 선택"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#9ca3af'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db'
                }}
              />
            </div>
          </div>

          {/* 구분선 */}
          <div style={{
            width: '1px',
            height: '32px',
            backgroundColor: '#d1d5db'
          }}></div>

          {/* 바닥 색상 */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <label style={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#374151'
            }}>
              바닥 색상
            </label>
            <div>
              <input
                type="color"
                value={floorColor}
                onChange={(e) => handleFloorColorChange(e.target.value)}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '8px',
                  border: '2px solid #d1d5db',
                  cursor: 'pointer',
                  transition: 'border-color 0.2s'
                }}
                title="바닥 색상 선택"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#9ca3af'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#d1d5db'
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 