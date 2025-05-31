'use client'

import { useState, useRef } from 'react'

interface BookCreatorProps {
  onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number) => void
  onClose: () => void
}

export default function BookCreator({ onBookCreate, onClose }: BookCreatorProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [thickness, setThickness] = useState<number>(2)
  const [aspectRatio, setAspectRatio] = useState<number>(1)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      
      // 이미지 URL 생성 (영구적으로 사용할 수 있도록)
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      
      // 이미지 로드하여 비율 계산
      const img = new Image()
      img.onload = () => {
        const ratio = img.width / img.height
        setAspectRatio(ratio)
        // URL은 책 생성 시까지 유지
      }
      img.src = url
    }
  }

  const handleCreate = () => {
    if (imageUrl && aspectRatio > 0) {
      // 책 생성 시 URL 전달 (Three.js에서 사용할 수 있도록)
      onBookCreate(imageUrl, thickness, aspectRatio)
      onClose()
    }
  }

  const handleCancel = () => {
    if (imageUrl) {
      URL.revokeObjectURL(imageUrl)
    }
    onClose()
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '20px',
      overflowY: 'auto'
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        maxWidth: '400px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        margin: 'auto'
      }}>
        <h2 style={{
          fontSize: '20px',
          fontWeight: '600',
          marginBottom: '20px',
          color: '#374151'
        }}>
          📚 책 만들기
        </h2>

        {/* 이미지 업로드 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            책 표지 이미지
          </label>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ display: 'none' }}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px dashed #d1d5db',
              borderRadius: '8px',
              backgroundColor: '#f9fafb',
              cursor: 'pointer',
              transition: 'all 0.2s',
              fontSize: '14px',
              color: '#6b7280'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6'
              e.currentTarget.style.backgroundColor = '#eff6ff'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db'
              e.currentTarget.style.backgroundColor = '#f9fafb'
            }}
          >
            {selectedImage ? selectedImage.name : '이미지 선택하기'}
          </button>
          
          {imageUrl && (
            <div style={{
              marginTop: '12px',
              textAlign: 'center'
            }}>
              <img
                src={imageUrl}
                alt="미리보기"
                style={{
                  maxWidth: '100%',
                  maxHeight: '120px',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb'
                }}
              />
              <p style={{
                fontSize: '12px',
                color: '#6b7280',
                marginTop: '4px'
              }}>
                비율: {aspectRatio.toFixed(2)}:1
              </p>
            </div>
          )}
        </div>

        {/* 두께 설정 */}
        <div style={{ marginBottom: '24px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            책 두께: {thickness}
          </label>
          
          <input
            type="range"
            min="1"
            max="5"
            value={thickness}
            onChange={(e) => setThickness(Number(e.target.value))}
            style={{
              width: '100%',
              height: '6px',
              borderRadius: '3px',
              background: '#e5e7eb',
              outline: 'none',
              cursor: 'pointer'
            }}
          />
          
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#6b7280',
            marginTop: '4px'
          }}>
            <span>얇음 (1)</span>
            <span>두꺼움 (5)</span>
          </div>
        </div>

        {/* 버튼들 */}
        <div style={{
          display: 'flex',
          gap: '12px'
        }}>
          <button
            onClick={handleCancel}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: '1px solid #d1d5db',
              borderRadius: '8px',
              backgroundColor: 'white',
              color: '#374151',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f9fafb'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'white'
            }}
          >
            취소
          </button>
          
          <button
            onClick={handleCreate}
            disabled={!imageUrl}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: imageUrl ? '#3b82f6' : '#d1d5db',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: imageUrl ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (imageUrl) {
                e.currentTarget.style.backgroundColor = '#2563eb'
              }
            }}
            onMouseLeave={(e) => {
              if (imageUrl) {
                e.currentTarget.style.backgroundColor = '#3b82f6'
              }
            }}
          >
            책 만들기
          </button>
        </div>
      </div>
    </div>
  )
} 