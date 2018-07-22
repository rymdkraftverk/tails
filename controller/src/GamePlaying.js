import React, { Component } from 'react'
import { EVENTS } from 'common'
import createCommand from './util/createCommand'

const COMMANDS = {
  NONE:  'none',
  LEFT:  'left',
  RIGHT: 'right',
}

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
      this.props.send({
        event:   EVENTS.RTC.PLAYER_MOVEMENT,
        payload: createCommand(this.state.ordering, this.state.lastCommand),
      })
      this.setState({ ordering: (this.state.ordering + 1) })
    }, 10)
  }

  componentWillUnmount() {
    clearInterval(this.state.intervalId)
  }

  sendCommand = ({ command, vibrate = false }) => () => {
    if (vibrate) {
      navigator.vibrate(100)
    }

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
          touchAction:     'manipulation',
          border:          `2rem solid ${playerColor}`,
          'border-radius': '4rem',
        }}
      >
        <div
          id="controller-left"
          style={{ touchAction: 'manipulation' }}
          onMouseDown={this.sendCommand({ command: COMMANDS.LEFT, vibrate: true })}
          onMouseUp={this.sendCommand({ command: COMMANDS.NONE })}
          onTouchStart={this.sendCommand({ command: COMMANDS.LEFT, vibrate: true })}
          onTouchEnd={this.sendCommand({ command: COMMANDS.NONE })}
        >
          LEFT
        </div>
        <div
          id="controller-right"
          style={{ touchAction: 'manipulation' }}
          onMouseDown={this.sendCommand({ command: COMMANDS.RIGHT, vibrate: true })}
          onMouseUp={this.sendCommand({ command: COMMANDS.NONE })}
          onTouchStart={this.sendCommand({ command: COMMANDS.RIGHT, vibrate: true })}
          onTouchEnd={this.sendCommand({ command: COMMANDS.NONE })}
        >
          RIGHT
        </div>
      </div>
    )
  }
}

export default GamePlaying

