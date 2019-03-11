import React, { useRef, useState, useEffect } from 'react'
import * as R from 'ramda'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import { Event } from 'common'
import IOSDisableDoubleTap from './IOSDisableDoubleTap'

const SEND_PLAYER_DEAD_TAP_INTERVAL = 60;

const Container = styled(IOSDisableDoubleTap)`
  height: 100vh;
  user-select: none;
  background: ${R.prop('color')};
`

const DeadText = styled.div`
  font-weight: bold;
  font-size: 3vw;
  color: gray;
  margin-bottom: 16px;
`

const TouchText = styled.div`
  font-size: 4vw;
  color: white;
`;

const TouchArea = styled.div`
  background-color: black;

  /* TODO: Change this to 100vh once we fix the issues with it on iOS */
  height: 80vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
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
  useEffect(() => {
    navigator.vibrate(100)
  }, [])

  const touchAreaElement = useRef(null)
  const [position, setPosition] = useState(null)
  const [sendData, setSendData] = useState(false)

  const onPlayerDeadClick = ({ touches }) => {
    if (touches && touchAreaElement.current) {
      const [{ clientX, clientY }] = touches
      const rect = touchAreaElement.current.getBoundingClientRect()

      const x = clientX / rect.width
      const y = clientY / rect.height
      
      setPosition({ x, y })
    }
  }

  const onTouchEnd = () => {
    setPosition(null)
  }

  useEffect(() => {
    const timeoutId = setInterval(() => {
      setSendData(true)
    }, SEND_PLAYER_DEAD_TAP_INTERVAL);
    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    if (sendData && position) {
      sendReliable({ event: Event.PLAYER_DEAD_TAP, payload: position })
      setSendData(false)
    }
  },[sendData, position])

  return (
    <Container
      color={playerColor}
    >
      <TouchArea 
        onTouchEnd={onTouchEnd}
        ref={touchAreaElement} 
        onTouchStart={onPlayerDeadClick} 
        onTouchMove={onPlayerDeadClick}
        >
          <DeadText>
            {'You\'re dead'}
          </DeadText>
          <TouchText>
            {'Touch to Sparkle!'}
          </TouchText>
      </TouchArea>
    </Container>
  )
}

PlayerDead.propTypes = {
  playerColor: PropTypes.string.isRequired,
  sendReliable: PropTypes.func.isRequired,
}

export default PlayerDead
