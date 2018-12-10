import * as R from 'ramda'
import React, { Component } from 'react'
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

const Separator = styled.div`
  width: 20px;
  background: black;
`

const Container = styled(IOSDisableDoubleTap)`
  display: flex;
  height: 100vh;
  overflow: hidden;
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
    this.props.send({
      event:   Event.PLAYER_MOVEMENT,
      payload: beta / 6,
    })
  }

  componentDidMount = () => {
    if (window.location.pathname.includes('gyro')) {
      window.addEventListener(
        "deviceorientation",
        this.handleOrientation,
        true
      );
    }
  }

  render() {
    const {
      playerColor,
    } = this.props

    return (
      <Container>
        <SteerButton
          playerColor={playerColor}
          onMouseDown={this.sendCommand(SteeringCommand.LEFT)}
          onMouseUp={this.sendCommand(SteeringCommand.NONE)}
          onTouchStart={this.sendCommand(SteeringCommand.LEFT)}
          onTouchEnd={this.sendCommand(SteeringCommand.NONE)}
        >
          <div>{'<'} </div>
        </SteerButton>
        <Separator />
        <SteerButton
          playerColor={playerColor}
          onMouseDown={this.sendCommand(SteeringCommand.RIGHT)}
          onMouseUp={this.sendCommand(SteeringCommand.NONE)}
          onTouchStart={this.sendCommand(SteeringCommand.RIGHT)}
          onTouchEnd={this.sendCommand(SteeringCommand.NONE)}
        >
          <div>{'>'} </div>
        </SteerButton>
      </Container>
    )
  }
}

GamePlaying.propTypes = {
  playerColor: PropTypes.string.isRequired,
  send:        PropTypes.func.isRequired,
}

export default GamePlaying

