import React from 'react'
import PropTypes from 'prop-types'

/* eslint-disable jsx-a11y/no-static-element-interactions */
/* eslint-disable jsx-a11y/click-events-have-key-events */
const IOSDisableDoubleTap = ({
  children,
  className,
}) => (
  <div
    className={className}
    style={{
      touchAction: 'manipulation',
    }}
    // Empty click listener to prevent double tap to zoom on iOS
    onClick={() => {}}
  >
    { children }
  </div>
)
/* eslint-enable jsx-a11y/no-static-element-interactions */
/* eslint-enable jsx-a11y/click-events-have-key-events */

IOSDisableDoubleTap.propTypes = {
  children:  PropTypes.node.isRequired,
  className: PropTypes.string,
}

IOSDisableDoubleTap.defaultProps = {
  className: null,
}

IOSDisableDoubleTap.displayName = 'IOSDisableDoubleTap'

export default IOSDisableDoubleTap
