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
  margin-top: auto;
  margin-bottom: 16px;
  height: 30vh;
`

const label = css`
  user-select: none;
  padding: 8px;
  font-family: inherit;
`

const Button = styled.button`
  ${label};
  border: 0.1em solid black;
  ${({ clicked }) => clicked
    ?
    `box-shadow: 0 0;
    top: 0.1em;
    left: 0.1em;
    color: #757575;
    border-color: #757575`
    : ''
  }
`

const ButtonContainer = styled.div`
  margin-bottom: auto;
`;

const InstructionsLine = styled.div`
  margin-bottom: 16px;
`;

const AwaitingPlayers = styled.div`
  ${label};
`

const playerColorToBackgroundColor = (player) => {
  const background = Color[player]
  return background || 'white'
}

class GameLobby extends Component {
  getButton = () => {
    const {
      readyPlayer,
      ready,
      startEnabled,
      startGame,
    } = this.props

    return ready && startEnabled
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

  render() {
    const {
      playerColor,
      playerCount,
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
                  <InstructionsLine>
                    {`
                      Phone = controller
                    `}
                  </InstructionsLine>
                  <InstructionsLine>
                    {` 
                      Play on the other screen
                    `}
                  </InstructionsLine>
                </Instructions>
                <ButtonContainer>
                {
                  this.getButton()
                }
                </ButtonContainer>
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
