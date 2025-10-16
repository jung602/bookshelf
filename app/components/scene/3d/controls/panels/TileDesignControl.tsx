'use client'

import { useState, useRef, useEffect } from 'react'
import {
  getThemeColors,
  TRANSITIONS,
  CONTROL_TOKENS,
  getControlContainerStyle,
} from '../utils/cssUtils'
import { useResponsiveDevice } from '../../../../../hooks/useResponsiveDevice'
import { SceneManager } from '../../SceneManager'

interface TileDesignControlProps {
  isDarkMode?: boolean
  sceneManager?: SceneManager
}

// 타일 디자인 카테고리 타입
type TileCategory = 'floor' | 'wall'

// 카테고리 메타데이터
interface CategoryMetadata {
  id: TileCategory
  name: string
  icon: string
}

// 카테고리 목록
const categories: CategoryMetadata[] = [
  { id: 'floor', name: 'Floor', icon: '🟫' },
  { id: 'wall', name: 'Wall', icon: '🧱' },
]

export default function TileDesignControl({ isDarkMode = false, sceneManager }: TileDesignControlProps) {
  const { isMobile } = useResponsiveDevice()
  const themeColors = getThemeColors(isDarkMode)
  const [activeCategory, setActiveCategory] = useState<TileCategory>('floor')
  
  // 기본 타일 이미지 (앱 내 기본 타일 사용)
  const defaultFloorPattern = process.env.NODE_ENV === 'production' 
    ? '/bookshelf/ui/BasicTile.png' 
    : '/ui/BasicTile.png'
  
  // 각 카테고리별 이미지와 배수 상태
  const [floorImage, setFloorImage] = useState<string | null>(defaultFloorPattern)
  const [floorRepeat, setFloorRepeat] = useState<number>(1)
  const [wallImage, setWallImage] = useState<string | null>(null)
  const [wallRepeat, setWallRepeat] = useState<number>(1)
  
  // 파일 입력 ref
  const floorFileInputRef = useRef<HTMLInputElement>(null)
  const wallFileInputRef = useRef<HTMLInputElement>(null)

  // SceneManager에서 현재 타일 상태 가져오기
  useEffect(() => {
    if (sceneManager) {
      const tileState = sceneManager.getCurrentTileState()
      
      // 바닥 타일 상태 업데이트
      if (tileState.floorTexture) {
        setFloorImage(tileState.floorTexture)
      }
      if (tileState.floorRepeat) {
        setFloorRepeat(tileState.floorRepeat)
      }
      
      // 벽 타일 상태 업데이트
      if (tileState.wallTexture) {
        setWallImage(tileState.wallTexture)
      }
      if (tileState.wallRepeat) {
        setWallRepeat(tileState.wallRepeat)
      }
    }
  }, [sceneManager])

  // 업로드된 이미지를 128x128로 리사이즈 (중앙 크롭 후 스케일)
  const resizeImageTo128 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = () => {
        const img = new Image()
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas')
            const ctx = canvas.getContext('2d')
            if (!ctx) return reject(new Error('Canvas context not available'))

            const TARGET = 128
            canvas.width = TARGET
            canvas.height = TARGET

            // 중앙 정사각형으로 크롭
            const cropSize = Math.min(img.width, img.height)
            const sx = (img.width - cropSize) / 2
            const sy = (img.height - cropSize) / 2

            // 고해상도 이미지를 줄일 때 품질 향상을 위한 설정
            ;(ctx as any).imageSmoothingEnabled = true
            ;(ctx as any).imageSmoothingQuality = 'high'

            ctx.clearRect(0, 0, TARGET, TARGET)
            ctx.drawImage(img, sx, sy, cropSize, cropSize, 0, 0, TARGET, TARGET)

            // WebP로 내보내기 (품질 0.8). 필요시 품질 조정 가능
            const dataUrl = canvas.toDataURL('image/webp', 0.8)
            resolve(dataUrl)
          } catch (err) {
            reject(err)
          }
        }
        img.onerror = (e) => reject(e)
        img.src = reader.result as string
      }
      reader.onerror = (e) => reject(e)
      reader.readAsDataURL(file)
    })
  }

  // 이미지 업로드 핸들러
  const handleImageUpload = async (category: TileCategory, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const resizedUrl = await resizeImageTo128(file)

      if (category === 'floor') {
        setFloorImage(resizedUrl)
        // 필요 시 즉시 씬에 반영하려면 아래 주석 해제
        // if (sceneManager) sceneManager.updateFloorTexture(resizedUrl, floorRepeat)
      } else {
        setWallImage(resizedUrl)
        // 필요 시 즉시 씬에 반영하려면 아래 주석 해제
        // if (sceneManager) sceneManager.updateWallTexture(resizedUrl, wallRepeat)
      }
    } catch (err) {
      console.error('이미지 리사이즈 중 오류:', err)
    } finally {
      // 같은 파일 재업로드 허용
      e.target.value = ''
    }
  }

  // 배수 변경 핸들러
  const handleRepeatChange = (category: TileCategory, value: number) => {
    if (category === 'floor') {
      setFloorRepeat(value)
    } else {
      setWallRepeat(value)
    }
  }

  // 적용 버튼 핸들러
  const handleApply = () => {
    if (activeCategory === 'floor') {
      if (sceneManager && floorImage) {
        sceneManager.updateFloorTexture(floorImage, floorRepeat)
      }
    } else {
      if (sceneManager) {
        sceneManager.updateWallTexture(wallImage, wallRepeat)
      }
    }
  }

  // 원래대로 버튼 핸들러 (기본 타일로 복구)
  const handleReset = () => {
    if (activeCategory === 'floor') {
      setFloorImage(defaultFloorPattern)
      setFloorRepeat(1)
      if (sceneManager) {
        sceneManager.updateFloorTexture(defaultFloorPattern, 1)
      }
    } else {
      setWallImage(null)
      setWallRepeat(1)
      if (sceneManager) {
        sceneManager.updateWallTexture(null, 1)
      }
    }
  }

  const renderTabButton = (category: CategoryMetadata) => {
    const isActive = activeCategory === category.id
    return (
      <button
        key={category.id}
        onClick={() => setActiveCategory(category.id)}
        className={`flex-1 cursor-pointer ${TRANSITIONS.default} select-none flex items-center justify-center`}
        style={{
          backgroundColor: isActive ? CONTROL_TOKENS.color.panel : themeColors.outerContainer,
          borderTopLeftRadius: CONTROL_TOKENS.radius.panel,
          borderTopRightRadius: CONTROL_TOKENS.radius.panel,
          borderBottomLeftRadius: isActive ? '0' : CONTROL_TOKENS.radius.panel,
          borderBottomRightRadius: isActive ? '0' : CONTROL_TOKENS.radius.panel,
          padding: isMobile ? `${CONTROL_TOKENS.spacing.md} ${CONTROL_TOKENS.spacing.lg}` : `${CONTROL_TOKENS.spacing.sm} ${CONTROL_TOKENS.spacing.md}`,
          minHeight: isMobile ? CONTROL_TOKENS.size.buttonLg : '36px',
          border: 'none',
        }}
      >
        <span className={`${isMobile ? 'text-xl' : 'text-lg'}`} style={{ filter: 'grayscale(100%)' }}>
          {category.icon}
        </span>
      </button>
    )
  }

  return (
    <div
      className={`relative ${TRANSITIONS.fast} flex flex-col overflow-hidden`}
      style={{ 
        ...getControlContainerStyle(isMobile),
        backgroundColor: themeColors.outerContainer,
      }}
    >
      {/* Tab Area - Fixed at top (축소된 높이) */}
      <div 
        className="flex-none"
        style={{
          padding: `${CONTROL_TOKENS.spacing.sm} ${CONTROL_TOKENS.spacing.sm} 0`,
        }}
      >
        <div className={`flex`} style={{ gap: isMobile ? CONTROL_TOKENS.spacing.md : CONTROL_TOKENS.spacing.sm }}>
          {categories.map(category => renderTabButton(category))}
        </div>
      </div>

      {/* Content Area - Two Grid Layout */}
      <div 
        className="flex-1 overflow-hidden flex flex-col"
        style={{ 
          backgroundColor: CONTROL_TOKENS.color.panel,
          margin: `0 ${CONTROL_TOKENS.spacing.sm} ${CONTROL_TOKENS.spacing.sm}`,
          borderTopLeftRadius: activeCategory === 'wall' ? CONTROL_TOKENS.radius.panel : '0',
          borderTopRightRadius: activeCategory === 'floor' ? CONTROL_TOKENS.radius.panel : '0',
          borderBottomLeftRadius: CONTROL_TOKENS.radius.panel,
          borderBottomRightRadius: CONTROL_TOKENS.radius.panel,
          padding: CONTROL_TOKENS.spacing.md,
          gap: CONTROL_TOKENS.spacing.sm,
        }}
      >
        {/* 상단 그리드: 3x2 정사각형 셀 */}
        <div 
          className="grid grid-cols-3 grid-rows-2"
          style={{
            gap: CONTROL_TOKENS.spacing.sm,
            aspectRatio: '3/2',
            width: '100%',
          }}
        >
          {/* 타일 미리보기 (2x2) */}
          <div 
            className="col-span-2 row-span-2 rounded-lg overflow-hidden"
            style={{ 
              backgroundColor: isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(255, 255, 255, 0.3)',
              backgroundImage: (activeCategory === 'floor' ? floorImage : wallImage) 
                ? `url(${activeCategory === 'floor' ? floorImage! : wallImage!})`
                : 'none',
              backgroundSize: `${100 / (activeCategory === 'floor' ? floorRepeat : wallRepeat)}% ${100 / (activeCategory === 'floor' ? floorRepeat : wallRepeat)}%`,
              backgroundRepeat: 'repeat',
              imageRendering: 'pixelated',
            }}
          >
            {!(activeCategory === 'floor' ? floorImage : wallImage) && (
              <div className="w-full h-full flex items-center justify-center">
                <div className="flex flex-col items-center" style={{ gap: '4px' }}>
                  <div className="flex items-center justify-center" style={{ fontSize: '28px', lineHeight: '28px', height: '28px', opacity: 0.3 }}>🖼️</div>
                  <div style={{ fontSize: '11px', lineHeight: '11px', color: isDarkMode ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)' }}>No image</div>
                </div>
              </div>
            )}
          </div>

          {/* 업로드 버튼 (1x1) */}
          <button
            onClick={() => {
              if (activeCategory === 'floor') {
                floorFileInputRef.current?.click()
              } else {
                wallFileInputRef.current?.click()
              }
            }}
            className={`rounded-lg ${TRANSITIONS.default} cursor-pointer select-none flex items-center justify-center relative overflow-hidden`}
            style={{
              backgroundColor: themeColors.inactiveBlock,
              boxShadow: `0px 1px 2px 0px ${themeColors.inactiveShadow}`,
              border: 'none',
            }}
          >
            <div 
              className="absolute inset-0 w-full h-full pointer-events-none rounded-lg"
              style={{
                boxShadow: `0px 1px 2px 0px inset ${themeColors.inactiveInnerShadow}`,
              }}
            />
            <div className="flex flex-col items-center relative z-10" style={{ gap: '4px' }}>
              <div className="flex items-center justify-center" style={{ filter: 'grayscale(100%)', opacity: 0.5, fontSize: '28px', lineHeight: '28px', height: '28px' }}>📤</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)', lineHeight: '11px' }}>Upload</div>
            </div>
          </button>

          {/* 원래대로 버튼 (1x1) */}
          <button
            onClick={handleReset}
            className={`rounded-lg ${TRANSITIONS.default} cursor-pointer select-none flex items-center justify-center relative overflow-hidden`}
            style={{
              backgroundColor: themeColors.inactiveBlock,
              boxShadow: `0px 1px 2px 0px ${themeColors.inactiveShadow}`,
              border: 'none',
            }}
          >
            <div 
              className="absolute inset-0 w-full h-full pointer-events-none rounded-lg"
              style={{
                boxShadow: `0px 1px 2px 0px inset ${themeColors.inactiveInnerShadow}`,
              }}
            />
            <div className="flex flex-col items-center relative z-10" style={{ gap: '4px' }}>
              <div className="flex items-center justify-center" style={{ filter: 'grayscale(100%)', opacity: 0.5, fontSize: '28px', lineHeight: '28px', height: '28px' }}>🔄</div>
              <div style={{ fontSize: '11px', fontWeight: 700, color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.3)', lineHeight: '11px' }}>Reset</div>
            </div>
          </button>
        </div>

        {/* 하단 그리드: 3x1 슬라이더 + 버튼 */}
        <div 
          className="grid grid-cols-3"
          style={{
            gap: CONTROL_TOKENS.spacing.sm,
            height: '100%',
          }}
        >
          {/* 배수 슬라이더 (2x1) */}
          <div className="col-span-2 flex items-center justify-center">
            <input
              type="range"
              min="1"
              max="5"
              step="1"
              value={activeCategory === 'floor' ? floorRepeat : wallRepeat}
              onChange={(e) => handleRepeatChange(activeCategory, parseInt(e.target.value))}
              className="tile-slider w-full cursor-pointer"
              style={{
                height: '50px',
              }}
            />
          </div>

          {/* 적용 버튼 (1x1) */}
          <button
            onClick={handleApply}
            className={`rounded-lg ${TRANSITIONS.default} cursor-pointer select-none flex items-center justify-center relative overflow-hidden`}
            style={{
              backgroundColor: themeColors.inactiveBlock,
              boxShadow: `0px 1px 2px 0px ${themeColors.inactiveShadow}`,
              border: 'none',
            }}
          >
            <div 
              className="absolute inset-0 w-full h-full pointer-events-none rounded-lg"
              style={{
                boxShadow: `0px 1px 2px 0px inset ${themeColors.inactiveInnerShadow}`,
              }}
            />
            <div className="relative z-10" style={{
              fontSize: '11px',
              fontWeight: 700,
              color: isDarkMode ? 'rgba(255, 255, 255, 0.5)' : '#000',
              lineHeight: '11px',
            }}>
              Apply
            </div>
          </button>
        </div>

        {/* 숨겨진 파일 입력 */}
        <input
          ref={floorFileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload('floor', e)}
          className="hidden"
        />
        <input
          ref={wallFileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleImageUpload('wall', e)}
          className="hidden"
        />
      </div>
    </div>
  )
}
