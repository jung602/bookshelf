'use client'

import { useState, useEffect, useCallback } from 'react'

interface ModelInfo {
  id: string
  type: string
  position: { x: number; y: number; z: number }
}

interface ModelLayerControlProps {
  getModels: () => ModelInfo[]
  onModelSelect?: (modelId: string) => void
  onModelDelete: (modelId: string) => void
  onModelVisibilityToggle?: (modelId: string, visible: boolean) => void
}

export default function ModelLayerControl({ 
  getModels, 
  onModelSelect, 
  onModelDelete, 
  onModelVisibilityToggle 
}: ModelLayerControlProps) {
  const [models, setModels] = useState<ModelInfo[]>([])
  const [selectedModelId, setSelectedModelId] = useState<string | null>(null)
  const [visibleModels, setVisibleModels] = useState<Set<string>>(new Set())

  // 모델 목록 업데이트
  const updateModels = useCallback(() => {
    const currentModels = getModels()
    setModels(currentModels)
    
    // 새로운 모델들을 기본적으로 보이도록 설정 (함수형 setState 사용)
    setVisibleModels(prevVisibleModels => {
      const newVisibleModels = new Set(prevVisibleModels)
      currentModels.forEach(model => {
        if (!newVisibleModels.has(model.id)) {
          newVisibleModels.add(model.id)
        }
      })
      return newVisibleModels
    })
  }, [getModels])

  useEffect(() => {
    updateModels()
    const interval = setInterval(updateModels, 1000) // 1초마다 업데이트
    return () => clearInterval(interval)
  }, [updateModels])

  const handleModelSelect = (modelId: string) => {
    setSelectedModelId(modelId)
    onModelSelect?.(modelId)
  }

  const handleModelDelete = (modelId: string) => {
    onModelDelete(modelId)
    if (selectedModelId === modelId) {
      setSelectedModelId(null)
    }
    // 모델 목록 즉시 업데이트
    setTimeout(updateModels, 100)
  }

  const handleVisibilityToggle = (modelId: string) => {
    const newVisibleModels = new Set(visibleModels)
    const isVisible = visibleModels.has(modelId)
    
    if (isVisible) {
      newVisibleModels.delete(modelId)
    } else {
      newVisibleModels.add(modelId)
    }
    
    setVisibleModels(newVisibleModels)
    onModelVisibilityToggle?.(modelId, !isVisible)
  }

  const getModelDisplayName = (type: string) => {
    const typeMap: Record<string, string> = {
      'chair': 'Chair',
      'stool': 'Stool',
      'book': 'Book'
    }
    return typeMap[type] || type
  }

  return (
    <div className="bg-gray-200 p-4 rounded-none shadow-inner w-64">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold text-black font-w95fa">
          Model Layer
        </h3>
        <button
          onClick={updateModels}
          className="px-2 py-1 bg-gray-300 text-xs font-w95fa text-black
                     hover:bg-gray-400 transition-colors"
          style={{ border: 'none' }}
          title="Refresh"
        >
          🔄
        </button>
      </div>
      
      <div className="space-y-2">
        {/* 모델 목록 */}
        <div className="bg-custom-white shadow-inner max-h-48 overflow-y-auto">
          {models.length === 0 ? (
            <div className="p-4 text-center text-gray-500 text-xs font-w95fa">
              No models
            </div>
          ) : (
            models.map((model) => (
              <div
                key={model.id}
                className={`
                  flex items-center p-2 last:border-b-0
                  ${selectedModelId === model.id ? 'bg-blue-100' : 'hover:bg-gray-50'}
                  cursor-pointer transition-colors
                `}
                onClick={() => handleModelSelect(model.id)}
              >
                {/* 가시성 토글 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleVisibilityToggle(model.id)
                  }}
                  className="mr-2 text-xs"
                  style={{ border: 'none' }}
                  title={visibleModels.has(model.id) ? 'Hide' : 'Show'}
                >
                  {visibleModels.has(model.id) ? '👁️' : '👁️‍🗨️'}
                </button>
                
                {/* 모델 정보 */}
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-medium text-black font-w95fa truncate">
                    {getModelDisplayName(model.type)}
                  </div>
                  <div className="text-xs text-gray-500 font-w95fa">
                    ID: {model.id.slice(-6)}
                  </div>
                </div>
                
                {/* 삭제 버튼 */}
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    handleModelDelete(model.id)
                  }}
                  className="ml-2 px-2 py-1 bg-red-300 text-xs font-w95fa text-black
                             hover:bg-red-400 transition-colors"
                  style={{ border: 'none' }}
                  title="Delete"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>
        
        {/* 통계 */}
        <div className="text-xs text-gray-600 font-w95fa text-center">
          Total {models.length} models
        </div>
      </div>
    </div>
  )
} 