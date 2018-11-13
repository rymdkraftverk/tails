import React, { Component, Fragment } from 'react'
import PropTypes from 'prop-types'
import { Color } from 'common'
import styled, { css } from 'styled-components'
import IOSDisableDoubleTap from './IOSDisableDoubleTap'

const Container = styled(IOSDisableDoubleTap)`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  height: 100vh;
  background-color: ${({ backgroundColor }) => backgroundColor};
  font-size: 4vw;
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

const Button = styled.button`
  ${label};
  // TODO: fix styling
  border: 0.1em solid ${({ clicked }) => clicked ? 'green' : 'black'} 
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
      readyPlayer,
      ready,
      startEnabled,
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
                {
                  // TODO: don't nest ternary
                  ready && startEnabled
                    ?
                      <Button
                        onClick={startGame}
                      >
                        {'Start Game!'}
                      </Button>
                    :
                      <Button
                        clicked={ready}
                        onClick={readyPlayer}
                      >
                        {'Ready!'}
                      </Button>
                }
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
  playerColor:  PropTypes.string.isRequired,
  playerCount:  PropTypes.number,
  ready:        PropTypes.bool.isRequired,
  startEnabled: PropTypes.bool.isRequired,
  readyPlayer:  PropTypes.func.isRequired,
  startGame:    PropTypes.func.isRequired,
}

GameLobby.defaultProps = {
  playerCount: 0,
}

export default GameLobby
