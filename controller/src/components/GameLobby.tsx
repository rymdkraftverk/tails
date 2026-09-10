import { Component } from 'react'
import { Color } from 'common'
import styled, { css } from 'styled-components'
import FullHeight from './FullHeight'
import IOSDisableDoubleTap from './IOSDisableDoubleTap'
import Button from './Button'
import ScrollLock from './ScrollLock'

const FullPage = styled(FullHeight)`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  background-color: var(--player-color);
  font-size: 5vw;
`

const Instructions = styled.div`
  display: flex;
  flex-direction: column;
  justify-content: space-around;
  align-items: center;
  text-align: center;
  margin-top: auto;
  margin-bottom: 16px;
`

const label = css`
  padding: 8px;
  font-family: inherit;
`

const ActionContainer = styled.div`
  margin-bottom: auto;
`

const InstructionsLine = styled.div`
  margin-bottom: 16px;
`

const AwaitingPlayers = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
`

const AwaitingPlayersTitle = styled.div`
  ${label};
`

const AwaitingPlayersSubtitle = styled.div`
  font-size: 3vw;
`

const AwaitingReadyPlayers = styled.div`
  color: var(--player-color);
  background: black;
  padding: 7px;
`

const getColorCode = (color: keyof typeof Color) => Color[color]

type GameLobbyProps = {
  playerColor: keyof typeof Color
  playerCount?: number
  ready: boolean
  startEnabled: boolean
  readyPlayer: () => void
  startGame: () => void
}

class GameLobby extends Component<GameLobbyProps> {
  getAction = () => {
    const { playerColor, ready, readyPlayer, startEnabled, startGame } =
      this.props

    if (!ready) {
      return <Button onClick={readyPlayer}>Ready!</Button>
    }

    if (startEnabled) {
      return <Button onClick={startGame}>Start Game!</Button>
    }

    return (
      <AwaitingReadyPlayers
        style={{ '--player-color': getColorCode(playerColor) }}
      >
        All players not ready
      </AwaitingReadyPlayers>
    )
  }

  render() {
    const { playerColor, playerCount = 0 } = this.props

    return (
      <IOSDisableDoubleTap>
        <FullPage style={{ '--player-color': getColorCode(playerColor) }}>
          <ScrollLock />
          {playerCount > 1 ? (
            <>
              <Instructions style={{ height: '30dvh' }}>
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
              <ActionContainer>{this.getAction()}</ActionContainer>
            </>
          ) : (
            <AwaitingPlayers>
              <AwaitingPlayersTitle>Ask a friend to join!</AwaitingPlayersTitle>
              <AwaitingPlayersSubtitle>
                (2 players minimum)
              </AwaitingPlayersSubtitle>
            </AwaitingPlayers>
          )}
        </FullPage>
      </IOSDisableDoubleTap>
    )
  }
}

export default GameLobby
