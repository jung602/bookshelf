import { CONTROL_TOKENS, TRANSITIONS } from '../utils/cssUtils'

interface ControlButtonProps {
  onClick: () => void
  isActive?: boolean
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
  className?: string
  ariaLabel?: string
  title?: string
}

export function ControlButton({ 
  onClick, 
  isActive = false, 
  children,
  size = 'md',
  className = '',
  ariaLabel,
  title,
}: ControlButtonProps) {
  const sizeValue = size === 'lg' ? CONTROL_TOKENS.size.buttonLg : CONTROL_TOKENS.size.button
  
  return (
    <button
      onClick={onClick}
      className={`flex items-center justify-center outline-button ${TRANSITIONS.default} ${className}`}
      style={{
        backgroundColor: isActive 
          ? CONTROL_TOKENS.color.buttonActive 
          : CONTROL_TOKENS.color.button,
        borderRadius: CONTROL_TOKENS.radius.button,
        boxShadow: CONTROL_TOKENS.shadow.sm,
        border: 'none',
        width: sizeValue,
        height: sizeValue,
      }}
      aria-label={ariaLabel}
      title={title}
    >
      {children}
    </button>
  )
}

