'use client'

import { useState, useEffect } from 'react'
import { SceneManager, RoomParams } from '../SceneManager'
import { getModelClass } from '../objects'
import { Book } from '../objects/book'
import FloorTileControl from './FloorTileControl'
import ModelLayerControl from './ModelLayerControl'
import ModelAddControl from './ModelAddControl'

interface ControlsContainerProps {
  sceneManager: SceneManager | null
  roomParams: RoomParams
  onRoomParamsChange: (params: RoomParams) => void
}

export default function ControlsContainer({
  sceneManager,
  roomParams,
  onRoomParamsChange
}: ControlsContainerProps) {
  const [isLandscape, setIsLandscape] = useState(true)
  const [activeTab, setActiveTab] = useState<'room' | 'model'>('room')

  // 브라우저 크기 변화 감지
  useEffect(() => {
    const updateOrientation = () => {
      setIsLandscape(window.innerWidth > window.innerHeight)
    }

    updateOrientation()
    window.addEventListener('resize', updateOrientation)
    
    return () => window.removeEventListener('resize', updateOrientation)
  }, [])

  // 바닥 그리드 변경 핸들러
  const handleFloorGridChange = (grid: boolean[][]) => {
    const newParams = { ...roomParams, customGrid: grid }
    onRoomParamsChange(newParams)
  }

  // 모델 추가 핸들러
  const handleModelAdd = async (modelType: string) => {
    if (!sceneManager) return

    try {
      // 벽 가구인 경우 특별 처리
      if (modelType === 'wallcube') {
        const wallCubeId = await sceneManager.addTestWallCube(0, 0)
        if (wallCubeId) {
          console.log('Wall cube added successfully:', wallCubeId)
        } else {
          console.log('Failed to add wall cube')
        }
        return
      }

      // 일반 바닥 가구 처리
      const ModelClass = getModelClass(modelType)
      
      if (!ModelClass) {
        console.warn(`Unknown model type: ${modelType}`)
        return
      }

      const model = new ModelClass()
      await sceneManager.getModelManager().addModel(model)
      console.log(`${modelType} model added successfully`)
    } catch (error) {
      console.error(`Failed to add ${modelType} model:`, error)
    }
  }

  // 책 생성 핸들러
  const handleBookCreate = async (imageUrl: string, thickness: number, aspectRatio: number, title: string) => {
    if (!sceneManager) return

    try {
      const bookConfig = {
        imageUrl,
        thickness,
        aspectRatio,
        title
      }
      
      const book = new Book(bookConfig)
      await sceneManager.getModelManager().addModel(book)
      console.log('Book created successfully')
    } catch (error) {
      console.error('Failed to create book:', error)
    }
  }

  // 모델 삭제 핸들러
  const handleModelDelete = (modelId: string) => {
    if (sceneManager) {
      sceneManager.deleteModel(modelId)
    }
  }

  // 모델 목록 가져오기
  const getModels = () => {
    if (!sceneManager) return []
    
    return sceneManager.getModelManager().getAllModels().map(model => ({
      id: model.getId(),
      type: model.getType(),
      position: model.getPosition()
    }))
  }

  // 룸 설정 컨트롤들
  const RoomControls = () => (
    <div className="space-y-4">
      <FloorTileControl
        initialGrid={roomParams.customGrid}
        onGridChange={handleFloorGridChange}
      />
    </div>
  )

  // 모델 관련 컨트롤들
  const ModelControls = () => (
    <div className="space-y-4">
      <ModelAddControl
        onModelAdd={handleModelAdd}
        onBookCreate={handleBookCreate}
      />
      
      <ModelLayerControl
        getModels={getModels}
        onModelSelect={(modelId) => {
          console.log('Model selected:', modelId)
        }}
        onModelDelete={handleModelDelete}
        onModelVisibilityToggle={(modelId, visible) => {
          console.log('Model visibility toggled:', modelId, visible)
        }}
      />
    </div>
  )

  return (
    <div className="w-full h-full bg-custom-white border-l-2 border-custom-gray" style={{ boxShadow: 'inset 2px 0 0 white' }}>
      {isLandscape ? (
        // 가로 모드: 상하로 반반씩 배치
        <div className="flex flex-col w-full h-full">
          {/* 룸 설정 컨트롤들 - 위쪽 50% */}
          <div className="w-full h-1/2 p-[12px] overflow-hidden border-b-2 border-custom-gray" style={{ boxShadow: '0 2px 0 0 white' }}>
          <div className="text-xs p-2 pb-[12px] font-semibold text-gray-800 font-w95fa">Room Settings</div>
          <div className="w-[80%]">
            <RoomControls />
          </div>
          </div>
          
          {/* 모델 관련 컨트롤들 - 아래쪽 50% */}
          <div className="w-full h-1/2 p-[12px]">
            <div className="h-full overflow-y-auto">
              <div className="text-xs font-semibold mb-4 text-gray-800 font-w95fa">Model Management</div>
              <ModelControls />
            </div>
          </div>
        </div>
      ) : (
        // 세로 모드: 탭으로 전환
        <div className="flex flex-col w-full h-full">
          {/* 탭 헤더 */}
          <div className="flex bg-custom-white">
            <button
              className={`flex-1 py-3 px-4 text-center font-medium font-w95fa transition-colors ${
                activeTab === 'room'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('room')}
            >
              Room Settings
            </button>
            <button
              className={`flex-1 py-3 px-4 text-center font-medium font-w95fa transition-colors ${
                activeTab === 'model'
                  ? 'text-blue-600 bg-blue-50'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
              onClick={() => setActiveTab('model')}
            >
              Model Management
            </button>
          </div>
          
          {/* 탭 컨텐츠 */}
          <div className="flex-1 p-4 overflow-y-auto">
            <div className="w-full h-full p-[12px]">
              {activeTab === 'room' ? <RoomControls /> : <ModelControls />}
            </div>
          </div>
        </div>
      )}
    </div>
  )
} 