import React, { Component } from 'react'
import EVENTS from 'common'

/* eslint-disable-next-line */
class GameLobby extends Component {
  /* eslint-disable-next-line */
  componentDidMount() {
    // this.props.send({ event: EVENTS.PLAYER_JOINED })
  }

  render() {
    return (
      <div style={{ backgroundColor: this.props.playerColor }}>
        <div className="flex-box" onClick={this.props.startGame}>Start Game!</div>
      </div>
    )
  }
}

export default GameLobby
