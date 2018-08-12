import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { EVENTS } from 'common'
import createCommand from '../util/createCommand'

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
      <div
        id="controller-container"
        style={{
          touchAction:  'manipulation',
          border:       `2rem solid ${playerColor}`,
          borderRadius: '4rem',
        }}
      >
        <div
          id="controller-left"
          style={{ touchAction: 'manipulation' }}
          onMouseDown={this.sendCommand(COMMANDS.LEFT)}
          onMouseUp={this.sendCommand(COMMANDS.NONE)}
          onTouchStart={this.sendCommand(COMMANDS.LEFT)}
          onTouchEnd={this.sendCommand(COMMANDS.NONE)}
        >
          LEFT
        </div>
        <div
          id="controller-right"
          style={{ touchAction: 'manipulation' }}
          onMouseDown={this.sendCommand(COMMANDS.RIGHT)}
          onMouseUp={this.sendCommand(COMMANDS.NONE)}
          onTouchStart={this.sendCommand(COMMANDS.RIGHT)}
          onTouchEnd={this.sendCommand(COMMANDS.NONE)}
        >
          RIGHT
        </div>
      </div>
    )
  }
}

GamePlaying.propTypes = {
  playerColor: PropTypes.string.isRequired,
  send:        PropTypes.func.isRequired,
}

export default GamePlaying

