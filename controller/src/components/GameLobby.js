import React, { Component } from 'react'
import PropTypes from 'prop-types'
import { COLORS } from 'common'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh; touchAction: 'manipulation';
  background-color: ${({ backgroundColor }) => backgroundColor};
`

const StartGameButton = styled.div`
  -webkit-touch-callout: none;
  -webkit-user-select: none;
  -khtml-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;

  height: 30vh;
  font-family : inherit;
  display: flex;
  align-items: center;
  justify-content: center;

  touch-action: 'manipulation';
`

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
      <Container
        backgroundColor={playerColorToBackgroundColor(playerColor)}
      >
        <StartGameButton
          onClick={startGame}
        >
          Start Game!
        </StartGameButton>
      </Container>
    )
  }
}

GameLobby.propTypes = {
  playerColor: PropTypes.string.isRequired,
  startGame:   PropTypes.func.isRequired,
}

export default GameLobby
