import React, { Component } from 'react'
import PropTypes from 'prop-types'
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

class GameLobby extends Component {
  render() {
    const {
      playerColor,
      startGame,
    } = this.props

    return (
      <div
        id="game-lobby-container"
        style={{ touchAction: 'manipulation', backgroundColor: playerColorToBackgroundColor(playerColor) }}
      >
        <div
          style={style}
          className="flex-box"
          onClick={startGame}
        >
          Start Game!
        </div>
      </div>
    )
  }
}

GameLobby.propTypes = {
  playerColor: PropTypes.string.isRequired,
  startGame:   PropTypes.func.isRequired,
}

export default GameLobby
