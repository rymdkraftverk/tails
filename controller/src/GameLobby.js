import React, { Component } from 'react'

const style = {
  '-webkit-touch-callout': 'none',
  '-webkit-user-select':   'none',
  '-khtml-user-select':    'none',
  '-moz-user-select':      'none',
  '-ms-user-select':       'none',
  'user-select':           'none',
}

/* eslint-disable-next-line fp/no-class */
class GameLobby extends Component {
  render() {
    return (
      <div id="game-lobby-container" style={{ backgroundColor: this.props.playerColor }}>
        <div style={style} className="flex-box" onClick={this.props.startGame}>Start Game!</div>
      </div>
    )
  }
}

export default GameLobby
