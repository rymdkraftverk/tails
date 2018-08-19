import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { EVENTS } from 'common'
import styled, { css } from 'styled-components'
import createCommand from '../util/createCommand'

const buttonStyle = css`
  padding-top: 15px;
  letter-spacing: 0.3em;
  text-align: center;
  flex: 1;
  user-select: none;
  touch-action: manipulation;
`

const Container = styled.div`
  display: flex;
  height: 100vh;
  overflow: hidden;
  touch-action: manipulation;
  border: ${({ playerColor }) => `2rem solid ${playerColor}`};
  border-radius: 4rem;
`

const ButtonLeft = styled.div`
  ${buttonStyle}
  background: #be5d4b;
`

const ButtonRight = styled.div`
  ${buttonStyle}
  background: #839870;
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
      event:   EVENTS.RTC.PLAYER_MOVEMENT,
      payload: createCommand(this.state.ordering, command),
    })

    this.setState(state => ({ lastCommand: command, ordering: state.ordering + 1 }))
  }

  render() {
    const {
      playerColor,
    } = this.props

    return (
      <Container
        playerColor={playerColor}
      >
        <ButtonLeft
          onMouseDown={this.sendCommand(COMMANDS.LEFT)}
          onMouseUp={this.sendCommand(COMMANDS.NONE)}
          onTouchStart={this.sendCommand(COMMANDS.LEFT)}
          onTouchEnd={this.sendCommand(COMMANDS.NONE)}
        >
          LEFT
        </ButtonLeft>
        <ButtonRight
          onMouseDown={this.sendCommand(COMMANDS.RIGHT)}
          onMouseUp={this.sendCommand(COMMANDS.NONE)}
          onTouchStart={this.sendCommand(COMMANDS.RIGHT)}
          onTouchEnd={this.sendCommand(COMMANDS.NONE)}
        >
          RIGHT
        </ButtonRight>
      </Container>
    )
  }
}

GamePlaying.propTypes = {
  playerColor: PropTypes.string.isRequired,
  send:        PropTypes.func.isRequired,
}

export default GamePlaying

