import PropTypes from 'prop-types'

function IOSDisableDoubleTap({ children, className = null }) {
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

IOSDisableDoubleTap.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
}

IOSDisableDoubleTap.displayName = 'IOSDisableDoubleTap'

export default IOSDisableDoubleTap
