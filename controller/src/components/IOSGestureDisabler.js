import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components'

const Disabler = styled.div`
  touch-action: manipulation;
  ${({ disableScrolling }) => disableScrolling && 'height: 100%'};
`

const IOSGestureDisabler = ({
  children,
  disableDoubleTap,
  disablePinchToZoom,
  disableScrolling,
}) => {
  // Prevent scrolling and two finger zoom on iOS
  if (disablePinchToZoom) {
    document.addEventListener(
      'touchmove',
      (e) => {
        e.preventDefault()
      },
      { passive: false },
    )
  }
  let props = {
    disableScrolling,
  }
  if (disableDoubleTap) {
    props = {
      ...props,
      onClick: () => {},
    }
  }
  return (
    <Disabler {...props}>
      { children }
    </Disabler>
  )
}

IOSGestureDisabler.propTypes = {
  children:           PropTypes.node.isRequired,
  disableDoubleTap:   PropTypes.bool,
  disablePinchToZoom: PropTypes.bool,
}

IOSGestureDisabler.defaultProps = {
  disableDoubleTap:   true,
  disablePinchToZoom: true,
}

IOSGestureDisabler.displayName = 'IOSGestureDisabler'

export default IOSGestureDisabler
