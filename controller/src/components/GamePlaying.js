import * as R from 'ramda'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Event, SteeringCommand } from 'common'
import styled from 'styled-components'

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

const Container = styled.div`
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
  sendCommand = command => () => {
    this.props.send({
      event:   Event.PLAYER_MOVEMENT,
      payload: command,
    })
  }

  render() {
    const {
      playerColor,
    } = this.props

    return (
      <Container onClick={() => {}}>
        { /* The empty onClick above disables double tap zoom on iOS Safari */}
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

