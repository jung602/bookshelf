'use client'

import { useState } from 'react'
import { SceneManager, RoomParams } from '../SceneManager'
import FloorTileControl from './FloorTileControl'
import TopBar from './TopBar'
import MenuBar from './MenuBar'
import ModelAddControl from './ModelAddControl'
import CollectionAddControl from './CollectionAddControl'
import { getModelClass } from '../objects'

interface ControlsContainerProps {
  sceneManager: SceneManager | null
  roomParams: RoomParams
  onRoomParamsChange: (params: RoomParams) => void
  isDarkMode: boolean
  isMobile: boolean
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export default function ControlsContainer({
  sceneManager,
  roomParams,
  onRoomParamsChange,
  isDarkMode,
  isMobile,
  isCollapsed,
  onToggleCollapse
}: ControlsContainerProps) {

  // 바닥 그리드 변경 핸들러
  const handleFloorGridChange = (grid: boolean[][]) => {
    const newParams = { ...roomParams, customGrid: grid }
    onRoomParamsChange(newParams)
  }

  // 선택된 메뉴 상태 관리
  const [selectedMenu, setSelectedMenu] = useState<string | null>(null)
  
  // 바운딩박스 표시 상태 관리
  const [showBoundingBoxes, setShowBoundingBoxes] = useState(false)

  // 메뉴 선택 핸들러
  const handleMenuSelect = (menuId: string) => {

    // 같은 메뉴를 다시 클릭하면 닫기, 다른 메뉴 클릭하면 전환
    setSelectedMenu((prevSelected: string | null) => prevSelected === menuId ? null : menuId)
  }
  
  // 바운딩박스 토글 핸들러
  const handleToggleBoundingBoxes = () => {
    if (sceneManager) {
      sceneManager.toggleBoundingBoxVisualization()
      setShowBoundingBoxes(!showBoundingBoxes)
    }
  }

  // 뒤로가기 핸들러 (메뉴로 돌아가기)
  const handleGoBack = () => {
    setSelectedMenu(null)
  }

  // 모델 관련 핸들러들
  const handleModelAdd = async (modelType: string) => {

    if (!sceneManager) {
      console.error('SceneManager가 없습니다.')
      return
    }

    try {
      const modelManager = sceneManager.getModelManager()
      
      // 모델 타입에 따라 다른 처리
      if (modelType === 'wallcube') {
        // 벽 큐브는 스마트 배치 사용 (위치 파라미터 없음)
        const modelId = await sceneManager.addTestWallCube()
        if (!modelId) {
          console.error('벽 큐브 추가 실패')
        }
        return
      }

      // 일반 모델들 (chair, stool, floorlamp)
      const ModelClass = getModelClass(modelType)
      if (!ModelClass) {
        console.error('모델 클래스를 찾을 수 없습니다:', modelType)
        return
      }

      // 모델 인스턴스 생성 (각 모델의 기본값 사용)
      const modelInstance = new ModelClass(
        { x: 0, y: 0, z: 0 }, // 위치
        undefined, // 스케일 - 각 모델의 기본값 사용
        undefined  // 회전 - 각 모델의 기본값 사용
      )

      // 모델 매니저를 통해 추가
      await modelManager.addModel(modelInstance)

    } catch (error) {
      console.error('모델 추가 실패:', error)
      alert(`모델 추가에 실패했습니다: ${error}`)
    }
  }

  const handleBookCreate = async (imageUrl: string, thickness: number, aspectRatio: number, title: string) => {

    if (!sceneManager) {
      console.error('SceneManager가 없습니다.')
      return
    }

    try {
      const modelManager = sceneManager.getModelManager()
      const BookClass = getModelClass('book')
      
      if (!BookClass) {
        console.error('Book 클래스를 찾을 수 없습니다.')
        return
      }

      // 책 인스턴스 생성 (BookConfig를 첫 번째 매개변수로 전달)
      const bookInstance = new BookClass(
        { imageUrl, thickness, aspectRatio, title }, // BookConfig
        { x: 0, y: 0, z: 0 }, // 위치
        { x: 1, y: 1, z: 1 }, // 스케일 (BookConfig의 thickness, aspectRatio가 사용됨)
        { x: 0, y: 0, z: 0 }  // 회전
      )

      // 모델 매니저를 통해 추가
      await modelManager.addModel(bookInstance)

    } catch (error) {
      console.error('책 생성 실패:', error)
      alert(`책 생성에 실패했습니다: ${error}`)
    }
  }


  return (
    <div className="w-full h-full flex flex-col relative">
      {/* 모바일 전용 TopBar - position fixed */}
      {isMobile && (
        <div className={`fixed w-full z-50 ${isCollapsed ? 'bottom-[42px]' : 'top-1/2'}`}>
          <TopBar 
            isMobile={isMobile}
            isCollapsed={isCollapsed}
            onToggleCollapse={onToggleCollapse}
            onGoBack={selectedMenu ? handleGoBack : undefined}
            isDarkMode={isDarkMode}
            sceneManager={sceneManager}
          />
        </div>
      )}

      {/* 데스크톱 전용 TopBar - 우측 상단 고정 */}
      {!isMobile && (
        <div className="fixed top-[12px] right-[12px] z-50">
          <button
            onClick={handleToggleBoundingBoxes}
            className={`flex items-center justify-center w-10 h-10 rounded-full shadow-lg transition-all duration-200 hover:shadow-xl ${
              showBoundingBoxes 
                ? 'bg-cyan-500 hover:bg-cyan-600' 
                : 'bg-white hover:bg-gray-50'
            }`}
            aria-label="바운딩박스 표시"
            title="바운딩박스 토글"
          >
            <svg 
              width="20" 
              height="20" 
              viewBox="0 0 16 16" 
              fill="none"
            >
              <rect 
                x="3" 
                y="3" 
                width="10" 
                height="10" 
                stroke={showBoundingBoxes ? '#ffffff' : '#6B7280'}
                strokeWidth="2"
                strokeDasharray="2 2"
                fill="none"
              />
              <circle cx="3" cy="3" r="1.5" fill={showBoundingBoxes ? '#ffffff' : '#00ffff'} />
              <circle cx="13" cy="3" r="1.5" fill={showBoundingBoxes ? '#ffffff' : '#00ffff'} />
              <circle cx="3" cy="13" r="1.5" fill={showBoundingBoxes ? '#ffffff' : '#00ffff'} />
              <circle cx="13" cy="13" r="1.5" fill={showBoundingBoxes ? '#ffffff' : '#00ffff'} />
            </svg>
          </button>
        </div>
      )}

      {/* 데스크톱에서 메뉴가 선택되었을 때 해당 UI를 위에 표시 */}
      {selectedMenu && !isMobile && (
        <div className="w-full aspect-square">
          {selectedMenu === 'floor' && (
            <FloorTileControl 
              isDarkMode={isDarkMode}
              onChange={handleFloorGridChange}
              initialGrid={roomParams.customGrid}
              sceneManager={sceneManager || undefined}
            />
          )}
          {selectedMenu === 'models' && (
            <ModelAddControl 
              onModelAdd={handleModelAdd}
              isDarkMode={isDarkMode}
            />
          )}
          {selectedMenu === 'layers' && (
            <CollectionAddControl 
              onBookCreate={handleBookCreate}
            />
          )}
          {selectedMenu === 'settings' && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">설정</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">추후 구현 예정</div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* 모바일에서 메뉴가 선택되었을 때는 MenuBar 숨김 */}
      {!(isMobile && selectedMenu) && (
        <MenuBar 
          isDarkMode={isDarkMode}
          onMenuSelect={handleMenuSelect}
          selectedMenu={selectedMenu}
          menuItems={[
            { id: "floor", label: "Floor", isActive: selectedMenu === 'floor' },
            { id: "models", label: "Furniture", isActive: selectedMenu === 'models' },
            { id: "layers", label: "Collection", isActive: selectedMenu === 'layers' },
            { id: "settings", label: "Tiles", isActive: selectedMenu === 'settings' },
          ]}
        />
      )}
      
      {/* 모바일에서 메뉴가 선택되었을 때 해당 UI를 전체 화면으로 표시 */}
      {selectedMenu && isMobile && (
        <div className="w-full h-full">
          {selectedMenu === 'floor' && (
            <FloorTileControl 
              isDarkMode={isDarkMode}
              onChange={handleFloorGridChange}
              initialGrid={roomParams.customGrid}
              sceneManager={sceneManager || undefined}
            />
          )}
          {selectedMenu === 'models' && (
            <ModelAddControl 
              onModelAdd={handleModelAdd}
              isDarkMode={isDarkMode}
            />
          )}
          {selectedMenu === 'layers' && (
            <CollectionAddControl 
              onBookCreate={handleBookCreate}
            />
          )}
          {selectedMenu === 'settings' && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">설정</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">추후 구현 예정</div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 