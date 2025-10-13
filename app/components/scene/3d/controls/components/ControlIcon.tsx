import { getIconColor } from '../utils/cssUtils'

// 바운딩박스 아이콘
export const BoundingBoxIcon = ({ isActive }: { isActive: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <rect 
      x="3" 
      y="3" 
      width="10" 
      height="10" 
      stroke={getIconColor(isActive)}
      strokeWidth="2" 
      strokeDasharray="2 2" 
      fill="none"
    />
    <circle cx="3" cy="3" r="1.5" fill={isActive ? '#00ffff' : getIconColor(isActive)} />
    <circle cx="13" cy="3" r="1.5" fill={isActive ? '#00ffff' : getIconColor(isActive)} />
    <circle cx="3" cy="13" r="1.5" fill={isActive ? '#00ffff' : getIconColor(isActive)} />
    <circle cx="13" cy="13" r="1.5" fill={isActive ? '#00ffff' : getIconColor(isActive)} />
  </svg>
)

// 뒤로가기 아이콘
export const BackIcon = ({ isActive = false }: { isActive?: boolean }) => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <path 
      d="M10 12L6 8L10 4" 
      stroke={getIconColor(isActive)}
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
)

// 접기/펼치기 아이콘
export const CollapseIcon = ({ 
  isActive = false, 
  isCollapsed 
}: { 
  isActive?: boolean
  isCollapsed: boolean 
}) => (
  <svg 
    width="16" 
    height="16" 
    viewBox="0 0 16 16" 
    fill="none"
    className={`transform transition-transform duration-200 ${isCollapsed ? 'rotate-180' : ''}`}
  >
    <path 
      d="M4 6L8 10L12 6" 
      stroke={getIconColor(isActive)}
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </svg>
)


