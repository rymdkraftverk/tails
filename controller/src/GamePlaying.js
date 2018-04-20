import React, { Component } from 'react'
import EVENTS from 'common'

const MOVES = {
  NONE:  'none',
  LEFT:  'left',
  RIGHT: 'right',
}

/* eslint-disable-next-line */
class GamePlaying extends Component {
  sendRight = () => {
    this.props.send({ event: EVENTS.PLAYER_MOVEMENT, payload: { command: MOVES.RIGHT } })
  }

  sendLeft = () => {
    this.props.send({ event: EVENTS.PLAYER_MOVEMENT, payload: { command: MOVES.LEFT } })
  }

  sendNone = () => {
    this.props.send({ event: EVENTS.PLAYER_MOVEMENT, payload: { command: MOVES.NONE } })
  }

  render() {
    return (
  <div id="controller-container">
  <div id="controller-left" onTouchStart={this.sendLeft} onTouchEnd={this.sendNone}>LEFT</div>
  <div id="controller-right"onTouchStart={this.sendRight} onTouchEnd={this.sendNone}>RIGHT</div>
  </div>
    )
  }
}

export default GamePlaying

