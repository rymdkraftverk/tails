import * as R from 'ramda'
import React from 'react'
import Switch from 'react-switch'
import PropTypes from 'prop-types'
import styled from 'styled-components/macro'
import Div100vh from 'react-div-100vh'
import IOSDisableDoubleTap from './IOSDisableDoubleTap'
import ScrollLock from './ScrollLock'
import TapSteering from './TapSteering'
import GyroSteering from './GyroSteering'

const VerticalSeparator = styled.div`
  width: 20px;
`

const TogglePane = styled.div`
  align-items: center;
  background: black;
  border-bottom: solid;
  border-color: white;
  color: white;
  display: flex;
  height: 40px;
  justify-content: center;
`

const Container = styled(Div100vh)`
  display: flex;
  flex-direction: column;
  background: ${R.prop('playerColor')};
`

const noop = () => {}

navigator.vibrate =
  navigator.vibrate ||
  navigator.webkitVibrate ||
  navigator.mozVibrate ||
  navigator.msVibrate ||
  noop

const GamePlaying = props => {
  const { angle, gyro, playerColor, send, setGyro } = props

  return (
    <IOSDisableDoubleTap>
      <ScrollLock />
      <Container playerColor={playerColor}>
        <TogglePane>
          GYRO
          <VerticalSeparator />
          <Switch onChange={setGyro} checked={gyro} />
        </TogglePane>
        {gyro ? <GyroSteering angle={angle} /> : <TapSteering send={send} />}
      </Container>
    </IOSDisableDoubleTap>
  )
}

GamePlaying.propTypes = {
  angle: PropTypes.number.isRequired,
  gyro: PropTypes.bool.isRequired,
  playerColor: PropTypes.string.isRequired,
  send: PropTypes.func.isRequired,
  setGyro: PropTypes.func.isRequired,
}

export default GamePlaying
