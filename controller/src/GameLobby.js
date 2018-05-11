import React, { Component } from 'react'

const style = {
  WebkitTouchCallout: 'none',
  WebkitUserSelect:   'none',
  khtmlUserSelect:    'none',
  MozUserSelect:      'none',
  msUserSelect:       'none',
  userSelect:         'none',

  touchAction: 'manipulation',
}

const playerBackgroundColors = {
  blue:      '#3E5AFF',
  brown:     '#945200',
  green:     '#95A783',
  orange:    '#FF9201',
  pink:      '#FF85FF',
  purple:    '#A73D8D',
  red:       '#CB725D',
  turqouise: '#009B9D',
  white:     '#EEEDEF',
  yellow:    '#ECF257',
}

const playerColorToBackgroundColor = (player) => {
  const background = playerBackgroundColors[player]
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
