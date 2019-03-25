import React, { useState, useEffect } from 'react'
import * as R from 'ramda'
import styled from 'styled-components/macro'
import PropTypes from 'prop-types'
import { Event } from 'common'
import IOSDisableDoubleTap from './IOSDisableDoubleTap'
import Div100vh from 'react-div-100vh'
import ScrollLock from './ScrollLock'

const SEND_PLAYER_DEAD_TAP_INTERVAL = 60

const Container = styled(Div100vh)`
  background: ${R.prop('color')};
`

const DeadText = styled.div`
  font-weight: bold;
  font-size: 3vw;
  color: gray;
  margin-bottom: 16px;

  /* TODO: Remove this once we fix the issues with it on iOS */
  margin-top: -50px;
`

const TouchText = styled.div`
  font-size: 4vw;
  color: white;
`

const TouchArea = styled(Div100vh)`
  background-color: black;
  width: 100vw;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`

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

  const [position, setPosition] = useState(null)
  const [sendData, setSendData] = useState(false)

  const onPlayerDeadClick = ({ touches, target }) => {
    if (touches && target) {
      const [{ clientX, clientY }] = touches
      const rect = target.getBoundingClientRect()

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
    }, SEND_PLAYER_DEAD_TAP_INTERVAL)
    return () => {
      clearTimeout(timeoutId)
    }
  }, [])

  useEffect(() => {
    if (sendData && position) {
      sendReliable({ event: Event.PLAYER_DEAD_TAP, payload: position })
      setSendData(false)
    }
  }, [sendData, position])

  return (
    <IOSDisableDoubleTap>
      <ScrollLock />
      <Container color={playerColor}>
        <TouchArea
          onTouchEnd={onTouchEnd}
          onTouchStart={onPlayerDeadClick}
          onTouchMove={onPlayerDeadClick}
        >
          <DeadText>{"You're dead"}</DeadText>
          <TouchText>{'Touch to Sparkle!'}</TouchText>
        </TouchArea>
      </Container>
    </IOSDisableDoubleTap>
  )
}

PlayerDead.propTypes = {
  playerColor: PropTypes.string.isRequired,
  sendReliable: PropTypes.func.isRequired,
}

export default PlayerDead
