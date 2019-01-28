import * as R from 'ramda'
import React, { Component } from 'react'
import Switch from "react-switch";
import PropTypes from 'prop-types'
import { Event, SteeringCommand } from 'common'
import styled from 'styled-components'
import IOSDisableDoubleTap from './IOSDisableDoubleTap'

const SteerButton = styled.div`
  flex: 1;
  user-select: none;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 100pt;
  background: ${R.prop('playerColor')};
`

const VerticalSeparator = styled.div`
  width: 20px;
`

const BlackSeparator = styled(VerticalSeparator)`
  background: black;
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

const Container = styled(IOSDisableDoubleTap)`
  height: 100vh;
  display: flex;
  flex-direction: column;
`

const SteeringContainer = styled.div`
  display: flex;
  overflow: hidden;
  height: 100%;
`

const noop = () => {}

navigator.vibrate = (navigator.vibrate ||
  navigator.webkitVibrate ||
  navigator.mozVibrate ||
  navigator.msVibrate || noop)

class GamePlaying extends Component {
  state = {
    lastOrientation: {},
  }

  sendCommand = command => () => {
    this.props.send({
      event:   Event.PLAYER_MOVEMENT,
      payload: command,
    })
  }

  handleOrientation = ({ beta }) => {
    if (!this.props.gyro) return

    this.props.send({
      event:   Event.PLAYER_MOVEMENT,
      payload: beta / 6,
    })
  }

  toggleOrientationListener = (on) => () => {
    const method = on ? 'addEventListener' : 'removeEventListener'
    window[method](
      "deviceorientation",
      this.handleOrientation,
      true
    )
  }

  componentDidMount = this.toggleOrientationListener(true)
  componentWillUnmount = this.toggleOrientationListener(false)

  render() {
    const {
      gyro,
      playerColor,
      setGyro,
    } = this.props

    return (
      <Container>
        <TogglePane>
          GYRO
          <VerticalSeparator />
          <Switch
            onChange={setGyro}
            checked={gyro}
          />
        </TogglePane>
        <SteeringContainer>
          <SteerButton
            playerColor={playerColor}
            onMouseDown={this.sendCommand(SteeringCommand.LEFT)}
            onMouseUp={this.sendCommand(SteeringCommand.NONE)}
            onTouchStart={this.sendCommand(SteeringCommand.LEFT)}
            onTouchEnd={this.sendCommand(SteeringCommand.NONE)}
          >
            <div>{'<'} </div>
          </SteerButton>
          <BlackSeparator />
          <SteerButton
            playerColor={playerColor}
            onMouseDown={this.sendCommand(SteeringCommand.RIGHT)}
            onMouseUp={this.sendCommand(SteeringCommand.NONE)}
            onTouchStart={this.sendCommand(SteeringCommand.RIGHT)}
            onTouchEnd={this.sendCommand(SteeringCommand.NONE)}
          >
            <div>{'>'} </div>
          </SteerButton>
        </SteeringContainer>
      </Container>
    )
  }
}

GamePlaying.propTypes = {
  gyro:        PropTypes.bool.isRequired,
  playerColor: PropTypes.string.isRequired,
  send:        PropTypes.func.isRequired,
  setGyro:     PropTypes.func.isRequired,
}

export default GamePlaying

