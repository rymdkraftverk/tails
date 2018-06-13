import React, { Component } from 'react'
import EVENTS from 'common'

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

const createCommand = (ordering, command) => ({ command, ordering, timestamp: new Date().getTime() })

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
        event:   EVENTS.PLAYER_MOVEMENT,
        payload: createCommand(this.state.ordering, this.state.lastMove),
      })
      this.setState({ ordering: (this.state.ordering + 1) })
    }, 100)
  }

  componentWillUnmount() {
    clearInterval(this.state.intervalId)
  }

  sendRight = () => {
    navigator.vibrate(100)
    this.props.send({
      event:   EVENTS.PLAYER_MOVEMENT,
      payload: createCommand(this.state.ordering, MOVES.RIGHT),
    })
    this.setState({ lastMove: MOVES.RIGHT, ordering: (this.state.ordering + 1) })
  }

  sendLeft = () => {
    navigator.vibrate(100)
    this.props.send({
      event:   EVENTS.PLAYER_MOVEMENT,
      payload: createCommand(this.state.ordering, MOVES.LEFT),
    })
    this.setState({ lastMove: MOVES.LEFT, ordering: (this.state.ordering + 1) })
  }

  sendNone = () => {
    this.props.send({
      event:   EVENTS.PLAYER_MOVEMENT,
      payload: createCommand(this.state.ordering, MOVES.NONE),
    })
    this.setState({ lastMove: MOVES.NONE, ordering: (this.state.ordering + 1) })
  }

  render() {
    return (
  <div id="controller-container" style={{ touchAction: 'manipulation' }}>
    <div id="controller-left" style={{ touchAction: 'manipulation' }} onMouseDown={this.sendLeft} onMouseUp={this.sendNone} onTouchStart={this.sendLeft} onTouchEnd={this.sendNone}>LEFT</div>
    <div id="controller-right" style={{ touchAction: 'manipulation' }} onMouseDown={this.sendRight} onMouseUp={this.sendNone} onTouchStart={this.sendRight} onTouchEnd={this.sendNone}>RIGHT</div>
  </div>
    )
  }
}

export default GamePlaying

