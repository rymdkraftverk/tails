import type { ReactNode } from 'react'

function IOSDisableDoubleTap({
  children,
  className,
}: {
  children: ReactNode
  className?: string
}) {
  return (
    <div
      className={className}
      style={{
        touchAction: 'manipulation',
      }}
      // Empty click listener to prevent double tap to zoom on iOS
      onClick={() => {}}
    >
      {children}
    </div>
  )
}

IOSDisableDoubleTap.displayName = 'IOSDisableDoubleTap'

export default IOSDisableDoubleTap
