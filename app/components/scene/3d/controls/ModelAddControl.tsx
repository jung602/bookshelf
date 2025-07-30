'use client'

import { useState } from 'react'

interface ModelType {
  id: string
  name: string
  icon: string
  description: string
}

interface ModelAddControlProps {
  onModelAdd: (modelType: string) => void
  onBookCreate: (imageUrl: string, thickness: number, aspectRatio: number, title: string) => void
}

export default function ModelAddControl({ onModelAdd, onBookCreate }: ModelAddControlProps) {
  const [showBookCreator, setShowBookCreator] = useState(false)
  const [bookTitle, setBookTitle] = useState('')
  const [bookThickness, setBookThickness] = useState(3)
  const [bookAspectRatio, setBookAspectRatio] = useState(1)
  const [imageFile, setImageFile] = useState<File | null>(null)

  const modelTypes: ModelType[] = [
    {
      id: 'chair',
      name: 'Chair',
      icon: '🪑',
      description: 'Standard chair'
    },
    {
      id: 'stool',
      name: 'Stool',
      icon: '🔲',
      description: 'High stool'
    },
    {
      id: 'floorlamp',
      name: 'Floor Lamp',
      icon: '💡',
      description: 'Floor standing lamp'
    },
    {
      id: 'wallcube',
      name: 'Wall Cube',
      icon: '📦',
      description: 'Wall-mounted cube'
    }
  ]

  const handleModelAdd = (modelType: string) => {
    onModelAdd(modelType)
  }

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setImageFile(file)
    }
  }

  const handleBookCreate = () => {
    if (!imageFile || !bookTitle.trim()) {
      alert('Please enter both image and title.')
      return
    }

    const imageUrl = URL.createObjectURL(imageFile)
    onBookCreate(imageUrl, bookThickness, bookAspectRatio, bookTitle)
    
    // 리셋
    setShowBookCreator(false)
    setBookTitle('')
    setBookThickness(3)
    setBookAspectRatio(1)
    setImageFile(null)
  }

  return (
    <div className="bg-gray-200 p-4 rounded-none shadow-inner w-64">
      <h3 className="text-xs font-bold mb-3 text-black font-w95fa">
        Add Model
      </h3>
      
      <div className="space-y-3">
        {/* 기본 모델들 */}
        <div className="grid grid-cols-1 gap-2">
          {modelTypes.map((model) => (
            <button
              key={model.id}
              onClick={() => handleModelAdd(model.id)}
              className="flex items-center p-3 bg-gray-300 rounded-none
                         hover:bg-gray-400 transition-colors text-left"
            >
              <span className="text-lg mr-3">{model.icon}</span>
              <div>
                <div className="text-xs font-medium text-black font-w95fa">{model.name}</div>
                <div className="text-xs text-gray-600 font-w95fa">{model.description}</div>
              </div>
            </button>
          ))}
        </div>

        {/* 책 생성 버튼 */}
        <button
          onClick={() => setShowBookCreator(!showBookCreator)}
          className="w-full flex items-center p-3 bg-blue-300 rounded-none
                     hover:bg-blue-400 transition-colors"
        >
          <span className="text-lg mr-3">📚</span>
          <div className="text-left">
            <div className="text-xs font-medium text-black font-w95fa">Create Book</div>
            <div className="text-xs text-gray-700 font-w95fa">Create book with custom image</div>
          </div>
        </button>

        {/* 책 생성 모달 */}
        {showBookCreator && (
          <div className="mt-4 p-3 bg-custom-white shadow-inner">
            <h4 className="text-xs font-bold mb-3 text-black font-w95fa">Create Book</h4>
            
            <div className="space-y-3">
              {/* 제목 입력 */}
              <div>
                <label className="block text-xs font-medium text-black font-w95fa mb-1">
                  Book Title
                </label>
                <input
                  type="text"
                  value={bookTitle}
                  onChange={(e) => setBookTitle(e.target.value)}
                  placeholder="Enter book title"
                  className="w-full p-2 text-xs font-w95fa
                             focus:outline-none focus:bg-blue-50"
                />
              </div>

              {/* 이미지 업로드 */}
              <div>
                <label className="block text-xs font-medium text-black font-w95fa mb-1">
                  Cover Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full text-xs font-w95fa p-1"
                />
              </div>

              {/* 두께 조절 */}
              <div>
                <label className="block text-xs font-medium text-black font-w95fa mb-1">
                  Thickness: {bookThickness}
                </label>
                <input
                  type="range"
                  min="1"
                  max="10"
                  value={bookThickness}
                  onChange={(e) => setBookThickness(parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* 비율 조절 */}
              <div>
                <label className="block text-xs font-medium text-black font-w95fa mb-1">
                  Ratio: {bookAspectRatio.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={bookAspectRatio}
                  onChange={(e) => setBookAspectRatio(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* 버튼들 */}
              <div className="flex gap-2">
                <button
                  onClick={handleBookCreate}
                  className="flex-1 px-3 py-2 bg-green-300 text-xs font-w95fa text-black
                             hover:bg-green-400 transition-colors"
                  disabled={!imageFile || !bookTitle.trim()}
                >
                  Create
                </button>
                <button
                  onClick={() => setShowBookCreator(false)}
                  className="flex-1 px-3 py-2 bg-gray-300 text-xs font-w95fa text-black
                             hover:bg-gray-400 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 