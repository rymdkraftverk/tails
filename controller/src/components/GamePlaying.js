import * as R from 'ramda'
import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { Event } from 'common'
import styled from 'styled-components'
import createCommand from '../util/createCommand'

const SteerButton = styled.div`
  flex: 1;
  user-select: none;
  touch-action: manipulation;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 100pt;
  background: ${R.prop('playerColor')}
`

const Separator = styled.div`
  width: 20px;
  background: black;
`

const Container = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  touch-action: manipulation;
`
const COMMANDS = {
  NONE:  'none',
  LEFT:  'left',
  RIGHT: 'right',
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
      ordering:    0,
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
      payload: createCommand(this.state.ordering, command),
    })

    this.setState(state => ({ lastCommand: command, ordering: state.ordering + 1 }))
  }

  render() {
    const {
      playerColor,
    } = this.props

    return (
      <Container>
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

