import React, { Component } from 'react'

/* eslint-disable-next-line fp/no-class */
class GameLobby extends Component {
  render() {
    return (
      <div style={{ backgroundColor: this.props.playerColor }}>
        <div className="flex-box" onClick={this.props.startGame}>Start Game!</div>
      </div>
    )
  }
}

export default GameLobby
