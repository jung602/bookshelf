'use client'

import { useState } from 'react'
import {
  getThemeColors,
  TRANSITIONS,
  getResponsiveContainerRounding,
  getResponsiveGridPadding,
  getResponsiveGridGap,
} from './utils/cssUtils'
import { useResponsiveDevice } from '../../../../hooks/useResponsiveDevice'
import { categories, allModels, type ModelCategory, type ModelMetadata, type CategoryMetadata } from '../objects'

interface ModelAddControlProps {
  onModelAdd: (modelType: string) => void
  isDarkMode?: boolean
}

export default function ModelAddControl({ onModelAdd, isDarkMode = false }: ModelAddControlProps) {
  const { isMobile } = useResponsiveDevice()
  const themeColors = getThemeColors(isDarkMode)
  const [activeCategory, setActiveCategory] = useState<ModelCategory>('chairs')

  const filteredModels = allModels
    .filter(model => model.id !== 'book') // 책 제외
    .filter(model => model.category === activeCategory)

  const handleModelAdd = (modelType: string) => {
    onModelAdd(modelType)
  }

  const renderModelButton = (model: ModelMetadata) => {
    return (
      <button
        key={model.id}
        onClick={() => handleModelAdd(model.id)}
        className={`relative shrink-0 cursor-pointer ${TRANSITIONS.default} select-none flex flex-col items-center justify-center p-2 aspect-square`}
        style={{
          backgroundColor: themeColors.inactiveBlock,
          borderRadius: '8px',
          border: 'none',
        }}
      >
        <span className="text-2xl mb-1">{model.icon}</span>
        <div className="text-xs font-medium text-white font-w95fa text-center">
          {model.name}
        </div>
      </button>
    )
  }

  const renderTabButton = (category: CategoryMetadata) => {
    const isActive = activeCategory === category.id
    const radius = isMobile ? '16px' : '12px'
    return (
      <button
        key={category.id}
        onClick={() => setActiveCategory(category.id)}
        className={`flex-shrink-0 cursor-pointer ${TRANSITIONS.default} select-none flex items-center justify-center aspect-square`}
        style={{
          backgroundColor: isActive ? '#B6FD83' : '#D4D4D8',
          borderRadius: radius,
          padding: isMobile ? '16px' : '12px',
          width: isMobile ? '56px' : '48px',
          height: isMobile ? '56px' : '48px',
          border: 'none',
        }}
      >
        <span className={`${isMobile ? 'text-2xl' : 'text-xl'}`} style={{ filter: 'grayscale(100%)' }}>
          {category.icon}
        </span>
      </button>
    )
  }

  return (
    <div
      className={`relative ${getResponsiveContainerRounding(isMobile)} ${TRANSITIONS.fast} flex flex-row overflow-hidden`}
      style={{ 
        backgroundColor: themeColors.outerContainer,
        width: isMobile ? '100%' : '400px',
        height: isMobile ? '100%' : '400px',
      }}
    >
      {/* Tab Area - Fixed at left */}
      <div 
        className="flex-none overflow-y-auto overflow-x-hidden [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
        style={{
          padding: `${isMobile ? '8px' : '8px'} 0 ${isMobile ? '8px' : '8px'} ${isMobile ? '8px' : '8px'}`,
        }}
      >
        <div className={`flex flex-col ${isMobile ? 'gap-3' : 'gap-2'}`}>
          {categories.map(category => renderTabButton(category))}
        </div>
      </div>

      {/* Content Area with rounded background */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col"
        style={{ 
          backgroundColor: '#f0f0f0',
          margin: `${isMobile ? '8px' : '8px'}`,
          borderRadius: isMobile ? '16px' : '16px',
        }}
      >
        {/* Grid Area */}
        <div
          className={`box-border ${getResponsiveGridGap(isMobile)} grid grid-cols-[repeat(3,_minmax(0px,_1fr))] ${getResponsiveGridPadding(isMobile)} ${TRANSITIONS.fast}`}
          style={{
            gridAutoRows: 'min-content',
          }}
        >
          {filteredModels.map(model => renderModelButton(model))}
        </div>
      </div>
    </div>
  )
} 