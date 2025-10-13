import { getControlContainerStyle, TRANSITIONS } from '../utils/cssUtils'
import { useResponsiveDevice } from '../../../../../hooks/useResponsiveDevice'

interface ControlContainerProps {
  children: React.ReactNode
  className?: string
}

export function ControlContainer({ children, className = '' }: ControlContainerProps) {
  const { isMobile } = useResponsiveDevice()
  
  return (
    <div 
      className={`relative ${TRANSITIONS.fast} ${className}`}
      style={getControlContainerStyle(isMobile)}
    >
      {children}
    </div>
  )
}


