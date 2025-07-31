'use client'

import { useState } from 'react'
import { SceneManager, RoomParams } from '../SceneManager'
import FloorTileControl from './FloorTileControl'
import TopBar from './TopBar'
import MenuBar from './MenuBar'
import ModelAddControl from './ModelAddControl'
import ModelLayerControl from './ModelLayerControl'
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

  // 메뉴 선택 핸들러
  const handleMenuSelect = (menuId: string) => {
    console.log('선택된 메뉴:', menuId)
    // 같은 메뉴를 다시 클릭하면 닫기, 다른 메뉴 클릭하면 전환
    setSelectedMenu((prevSelected: string | null) => prevSelected === menuId ? null : menuId)
  }

  // 뒤로가기 핸들러 (메뉴로 돌아가기)
  const handleGoBack = () => {
    setSelectedMenu(null)
  }

  // 모델 관련 핸들러들
  const handleModelAdd = async (modelType: string) => {
    console.log('모델 추가:', modelType)
    if (!sceneManager) {
      console.error('SceneManager가 없습니다.')
      return
    }

    try {
      const modelManager = sceneManager.getModelManager()
      
      // 모델 타입에 따라 다른 처리
      if (modelType === 'wallcube') {
        // 벽 큐브는 특별한 메서드 사용
        const modelId = await sceneManager.addTestWallCube(0, 0)
        if (modelId) {
          console.log('벽 큐브 추가 성공:', modelId)
        } else {
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

      // 모델 인스턴스 생성 (기본 위치에 배치)
      const modelInstance = new ModelClass(
        { x: 0, y: 0, z: 0 }, // 위치
        { x: 1, y: 1, z: 1 }, // 스케일
        { x: 0, y: 0, z: 0 }  // 회전
      )

      // 모델 매니저를 통해 추가
      await modelManager.addModel(modelInstance)
      console.log('모델 추가 성공:', modelType, modelInstance.getId())
    } catch (error) {
      console.error('모델 추가 실패:', error)
      alert(`모델 추가에 실패했습니다: ${error}`)
    }
  }

  const handleBookCreate = async (imageUrl: string, thickness: number, aspectRatio: number, title: string) => {
    console.log('책 생성:', { imageUrl, thickness, aspectRatio, title })
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
      console.log('책 생성 성공:', title, bookInstance.getId())
    } catch (error) {
      console.error('책 생성 실패:', error)
      alert(`책 생성에 실패했습니다: ${error}`)
    }
  }

  const getModels = () => {
    if (!sceneManager) return []
    
    try {
      const modelManager = sceneManager.getModelManager()
      const models = modelManager.getAllModels()
      
      // ModelLayerControl에서 요구하는 형태로 변환
      return models.map(model => ({
        id: model.getId(),
        type: model.getType(),
        position: model.getPosition()
      }))
    } catch (error) {
      console.error('모델 목록 가져오기 실패:', error)
      return []
    }
  }

  const handleModelSelect = (modelId: string) => {
    console.log('모델 선택:', modelId)
    if (!sceneManager) return

    try {
      const interactionManager = sceneManager.getInteractionManager()
      // InteractionManager를 통해 모델 선택 (기즈모 표시)
      // 실제 선택 로직은 InteractionManager에서 처리됩니다
      console.log('모델 선택 요청:', modelId)
    } catch (error) {
      console.error('모델 선택 실패:', error)
    }
  }

  const handleModelDelete = (modelId: string) => {
    console.log('모델 삭제:', modelId)
    if (!sceneManager) return

    try {
      sceneManager.deleteModel(modelId)
      console.log('모델 삭제 성공:', modelId)
    } catch (error) {
      console.error('모델 삭제 실패:', error)
    }
  }

  const handleModelVisibilityToggle = (modelId: string, visible: boolean) => {
    console.log('모델 가시성 토글:', modelId, visible)
    if (!sceneManager) return

    try {
      const modelManager = sceneManager.getModelManager()
      const model = modelManager.getModel(modelId)
      
      if (model) {
        const threeModel = model.getModel()
        if (threeModel) {
          threeModel.visible = visible
          console.log('모델 가시성 변경 성공:', modelId, visible)
        }
      }
    } catch (error) {
      console.error('모델 가시성 토글 실패:', error)
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
          />
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
            <div className="w-full h-full flex gap-4 p-4">
              <ModelAddControl 
                onModelAdd={handleModelAdd}
                onBookCreate={handleBookCreate}
              />
              <ModelLayerControl 
                getModels={getModels}
                onModelSelect={handleModelSelect}
                onModelDelete={handleModelDelete}
                onModelVisibilityToggle={handleModelVisibilityToggle}
              />
            </div>
          )}
          {selectedMenu === 'layers' && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">레이어 관리</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">추후 구현 예정</div>
              </div>
            </div>
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
            <div className="w-full h-full flex flex-col gap-4 p-4">
              <ModelAddControl 
                onModelAdd={handleModelAdd}
                onBookCreate={handleBookCreate}
              />
              <ModelLayerControl 
                getModels={getModels}
                onModelSelect={handleModelSelect}
                onModelDelete={handleModelDelete}
                onModelVisibilityToggle={handleModelVisibilityToggle}
              />
            </div>
          )}
          {selectedMenu === 'layers' && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
              <div className="text-center">
                <div className="text-lg font-semibold mb-2">레이어 관리</div>
                <div className="text-sm text-gray-600 dark:text-gray-400">추후 구현 예정</div>
              </div>
            </div>
          )}
          {selectedMenu === 'settings' && (
            <div className="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
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