import React, { Component } from 'react'
import { COLORS } from 'common'

const style = {
  WebkitTouchCallout: 'none',
  WebkitUserSelect:   'none',
  khtmlUserSelect:    'none',
  MozUserSelect:      'none',
  msUserSelect:       'none',
  userSelect:         'none',

  touchAction: 'manipulation',
}

const playerColorToBackgroundColor = (player) => {
  const background = COLORS[player]
  return background || 'white'
}

/* eslint-disable-next-line fp/no-class */
class GameLobby extends Component {
  render() {
    return (
      <div id="game-lobby-container" style={{ touchAction: 'manipulation', backgroundColor: playerColorToBackgroundColor(this.props.playerColor) }}>
        <div style={style} className="flex-box" onClick={this.props.startGame}>Start Game!</div>
      </div>
    )
  }
}

export default GameLobby
