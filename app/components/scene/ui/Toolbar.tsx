'use client'

import { useState } from 'react'
import ColorTools from './tools/ColorTools'
import ModelTools from './tools/ModelTools'

interface ToolbarProps {
  onWallColorChange: (color: string) => void
  onFloorColorChange: (color: string) => void
  onModelAdd: (modelType: string) => void
  initialWallColor?: string
  initialFloorColor?: string
}

export default function Toolbar({
  onWallColorChange,
  onFloorColorChange,
  onModelAdd,
  initialWallColor = '#cccccc',
  initialFloorColor = '#ffffff'
}: ToolbarProps) {
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
        borderRadius: '12px',
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        border: '1px solid #e5e7eb',
        padding: '16px'
      }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '24px'
        }}>
          {/* 색상 도구 */}
          <ColorTools
            onWallColorChange={onWallColorChange}
            onFloorColorChange={onFloorColorChange}
            initialWallColor={initialWallColor}
            initialFloorColor={initialFloorColor}
          />

          {/* 구분선 */}
          <div style={{
            width: '1px',
            height: '40px',
            backgroundColor: '#d1d5db'
          }}></div>

          {/* 모델 도구 */}
          <ModelTools onModelAdd={onModelAdd} />
        </div>
      </div>
    </div>
  )
} 