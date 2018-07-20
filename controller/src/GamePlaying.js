import React, { Component } from 'react'
import { EVENTS } from 'common'

const MOVES = {
  NONE:  'none',
  LEFT:  'left',
  RIGHT: 'right',
}

const noop = () => {}

navigator.vibrate = (navigator.vibrate ||
  navigator.webkitVibrate ||
  navigator.mozVibrate ||
  navigator.msVibrate || noop)

const createCommand = (ordering, command) => ({ command, ordering })

/* eslint-disable-next-line fp/no-class */
class GamePlaying extends Component {
  constructor(props) {
    super(props)
    this.state = {
      ordering: 0,
      lastMove: MOVES.NONE,
    }

    this.state.intervalId = setInterval(() => {
      this.props.send({
        event:   EVENTS.RTC.PLAYER_MOVEMENT,
        payload: createCommand(this.state.ordering, this.state.lastMove),
      })
      this.setState({ ordering: (this.state.ordering + 1) })
    }, 10)
  }

  componentWillUnmount() {
    clearInterval(this.state.intervalId)
  }

  sendCommand = ({ move, vibrate = false }) => () => {
    if (vibrate) {
      navigator.vibrate(100)
    }

    this.props.send({
      event:   EVENTS.RTC.PLAYER_MOVEMENT,
      payload: createCommand(this.state.ordering, move),
    })

    this.setState(state => ({ lastMove: move, ordering: state.ordering + 1 }))
  }

  render() {
    const {
      playerColor,
    } = this.props

    return (
      <div id="controller-container" style={{
          touchAction:     'manipulation',
          border:          `2rem solid ${playerColor}`,
          'border-radius': '4rem',
        }}>
        <div
          id="controller-left"
          style={{ touchAction: 'manipulation' }}
          onMouseDown={this.sendCommand({ move: MOVES.LEFT, vibrate: true })}
          onMouseUp={this.sendCommand({ move: MOVES.NONE })}
          onTouchStart={this.sendCommand({ move: MOVES.LEFT, vibrate: true })}
          onTouchEnd={this.sendCommand({ move: MOVES.NONE })}
        >
          LEFT
        </div>
        <div
          id="controller-right"
          style={{ touchAction: 'manipulation' }}
          onMouseDown={this.sendCommand({ move: MOVES.RIGHT, vibrate: true })}
          onMouseUp={this.sendCommand({ move: MOVES.NONE })}
          onTouchStart={this.sendCommand({ move: MOVES.RIGHT, vibrate: true })}
          onTouchEnd={this.sendCommand({ move: MOVES.NONE })}
        >
          RIGHT
        </div>
      </div>
    )
  }
}

export default GamePlaying

