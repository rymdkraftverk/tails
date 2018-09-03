import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { Color } from 'common'
import styled, { css } from 'styled-components'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  height: 100vh;
  touch-action: manipulation;
  background-color: ${({ backgroundColor }) => backgroundColor};
`

const Instructions = styled.div`
  user-select: none;
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  text-align: center;
  height: 25vh;
`

const label = css`
  user-select: none;
  padding: 16px 8px;
  font-family: inherit;
`

const StartGameButton = styled.button`
  ${label};
  touch-action: manipulation;
  border: 0.1em solid black;
`

const AwaitingPlayers = styled.div`
  ${label};
`

const playerColorToBackgroundColor = (player) => {
  const background = Color[player]
  return background || 'white'
}

class GameLobby extends Component {
  render() {
    const {
      playerColor,
      playerCount,
      startGame,
    } = this.props

    return (
      <Container
        backgroundColor={playerColorToBackgroundColor(playerColor)}
      >
        {
          playerCount > 1
            ?
              <Fragment>
                <Instructions>
                  <div>
                    {`
                    Your phone is the controller
                  `}
                  </div>
                  <div>
                    {`
                    The game is played on the other screen
                  `}
                  </div>
                </Instructions>
                <StartGameButton
                  onClick={startGame}
                >
                  {'I\'m ready!'}
                </StartGameButton>
              </Fragment>

            :
              <AwaitingPlayers>
                Awaiting more players...
              </AwaitingPlayers>
        }
      </Container>
    )
  }
}

GameLobby.propTypes = {
  playerColor: PropTypes.string.isRequired,
  playerCount: PropTypes.number,
  startGame:   PropTypes.func.isRequired,
}

GameLobby.defaultProps = {
  playerCount: 0,
}

export default GameLobby
