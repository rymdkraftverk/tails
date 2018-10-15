import * as R from 'ramda'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Event } from 'common'
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

// TODO: centralize definition
const COMMANDS = {
  NONE:  0,
  LEFT:  1,
  RIGHT: 2,
}

const SEND_INTERVAL = 250

const noop = () => {}

navigator.vibrate = (navigator.vibrate ||
  navigator.webkitVibrate ||
  navigator.mozVibrate ||
  navigator.msVibrate || noop)

class GamePlaying extends Component {
  constructor(props) {
    super(props)
    this.state = {
      lastCommand: COMMANDS.NONE,
    }

    this.state.intervalId = setInterval(() => {
      this.sendCommand({ command: this.state.lastCommand })
    }, SEND_INTERVAL)
  }

  componentWillUnmount() {
    clearInterval(this.state.intervalId)
  }

  sendCommand = command => () => {
    this.props.send({
      event:   Event.Rtc.PLAYER_MOVEMENT,
      payload: { command },
    })

    this.setState({ lastCommand: command })
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
          onMouseDown={this.sendCommand(COMMANDS.LEFT)}
          onMouseUp={this.sendCommand(COMMANDS.NONE)}
          onTouchStart={this.sendCommand(COMMANDS.LEFT)}
          onTouchEnd={this.sendCommand(COMMANDS.NONE)}
        >
          <div>{'<'} </div>
        </SteerButton>
        <Separator />
        <SteerButton
          playerColor={playerColor}
          onMouseDown={this.sendCommand(COMMANDS.RIGHT)}
          onMouseUp={this.sendCommand(COMMANDS.NONE)}
          onTouchStart={this.sendCommand(COMMANDS.RIGHT)}
          onTouchEnd={this.sendCommand(COMMANDS.NONE)}
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

