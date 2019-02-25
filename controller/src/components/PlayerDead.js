import React, { useRef } from 'react'
import * as R from 'ramda'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Event } from 'common'
import IOSDisableDoubleTap from './IOSDisableDoubleTap'

const Container = styled(IOSDisableDoubleTap)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100vh;
  user-select: none;
  background: ${R.prop('color')};
  align-items: center;
`

const Text = styled.div`
  font-weight: bold;
`

const TouchArea = styled.div`
  background-color: black;
  height: 200px;
  width: 100vw;
  color: white;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const noop = () => {}

navigator.vibrate =
  navigator.vibrate ||
  navigator.webkitVibrate ||
  navigator.mozVibrate ||
  navigator.msVibrate ||
  noop

const PlayerDead = ({ playerColor, sendReliable }) => {
  navigator.vibrate(100)
  const touchAreaElement = useRef(null)
  const onPlayerDeadClick = ({ touches }) => {
    if (touches && touchAreaElement.current) {
      const [{ clientX, clientY }] = touches
      const rect = touchAreaElement.current.getBoundingClientRect()

      const x = clientX / rect.width
      const y = (clientY - rect.top) / rect.height
      
      sendReliable({ event: Event.PLAYER_DEAD_TAP, payload: { x, y } })
    }
  }

  return (
    <Container
      color={playerColor}
    >
      <Text>{'You\'re dead'}</Text>
      <TouchArea ref={touchAreaElement} onTouchMove={onPlayerDeadClick}>{'Tap to Sparkle!'}</TouchArea>
    </Container>
  )
}

PlayerDead.propTypes = {
  playerColor: PropTypes.string.isRequired,
  sendReliable: PropTypes.func.isRequired,
}

export default PlayerDead
