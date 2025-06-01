'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'

interface BookCreatorProps {
  onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void
  onClose: () => void
}

export default function BookCreator({ onBookCreate, onClose }: BookCreatorProps) {
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imageUrl, setImageUrl] = useState<string>('')
  const [thickness, setThickness] = useState<number>(3)
  const [aspectRatio, setAspectRatio] = useState<number>(1)
  const [title, setTitle] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedImage(file)
      const url = URL.createObjectURL(file)
      setImageUrl(url)
      
      // 이미지 로드해서 비율 계산
      const img = new window.Image()
      img.onload = () => {
        const ratio = img.width / img.height
        setAspectRatio(ratio)
      }
      img.src = url
    }
  }

  const handleCreate = () => {
    if (imageUrl && title.trim()) {
      onBookCreate(imageUrl, thickness, aspectRatio, title.trim())
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
      width: '100%',
      height: '100%',
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '24px',
        width: '400px',
        maxWidth: '90vw',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}>
        {/* 헤더 */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#111827',
            margin: 0
          }}>
            새 책 만들기
          </h2>
          
          <button
            onClick={handleCancel}
            style={{
              padding: '8px',
              border: 'none',
              background: 'none',
              fontSize: '20px',
              cursor: 'pointer',
              color: '#6b7280',
              borderRadius: '4px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#f3f4f6'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            ✕
          </button>
        </div>

        {/* 책 제목 입력 */}
        <div style={{ marginBottom: '20px' }}>
          <label style={{
            display: 'block',
            fontSize: '14px',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '8px'
          }}>
            책 제목
          </label>
          
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="책 제목을 입력하세요"
            style={{
              width: '100%',
              padding: '10px 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '14px',
              outline: 'none',
              transition: 'border-color 0.2s'
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = '#3b82f6'
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = '#d1d5db'
            }}
          />
        </div>

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
              <Image
                src={imageUrl}
                alt="미리보기"
                width={120}
                height={120}
                style={{
                  maxWidth: '100%',
                  maxHeight: '120px',
                  borderRadius: '4px',
                  border: '1px solid #e5e7eb',
                  objectFit: 'contain'
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
            disabled={!imageUrl || !title.trim()}
            style={{
              flex: 1,
              padding: '10px 16px',
              border: 'none',
              borderRadius: '8px',
              backgroundColor: (imageUrl && title.trim()) ? '#3b82f6' : '#d1d5db',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: (imageUrl && title.trim()) ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              if (imageUrl && title.trim()) {
                e.currentTarget.style.backgroundColor = '#2563eb'
              }
            }}
            onMouseLeave={(e) => {
              if (imageUrl && title.trim()) {
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