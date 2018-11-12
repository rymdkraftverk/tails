import React, { Component } from 'react'
import Fullscreen from 'react-full-screen'
import { Event, Color, Channel } from 'common'
import signaling from 'signaling'

import channelConfigs from '../channelConfigs'
import LockerRoom from './LockerRoom'
import LockerRoomLoader from './LockerRoomLoader'
import GameLobby from './GameLobby'
import GamePlaying from './GamePlaying'
import AwatingNextRound from './AwatingNextRound'
import PlayerDead from './PlayerDead'
import isMobileDevice from '../util/isMobileDevice'
import { getLastGameCode, setLastGameCode } from '../util/localStorage'

const { error: logError, log } = console

const { REACT_APP_WS_ADDRESS: WS_ADDRESS } = process.env
const TIMEOUT_SECONDS = 20

log('REACT_APP_WS_ADDRESS', WS_ADDRESS)

const AppState = {
  LOCKER_ROOM:     'locker-room',
  GAME_CONNECTING: 'game-connecting',
  GAME_LOBBY:      'game-lobby',
  GAME_PLAYING:    'game-playing',
  PLAYER_DEAD:     'player-dead',
}

const colorState = ({ started, color }) => (
  {
    appState: started
      ? AppState.AWAITING_NEXT_ROUND
      : AppState.GAME_LOBBY,
    playerColor: color,
  }
)

const errorState = message => ({
  appState: AppState.LOCKER_ROOM,
  error:    message,
})

const eventState = ({ event, payload }) => {
  switch (event) {
    case Event.A_PLAYER_JOINED: return payload
    case Event.A_PLAYER_LEFT: return payload
    case Event.CONTROLLER_COLOR: return colorState(payload)
    case Event.GAME_FULL: return errorState('Game is full')
    case Event.PLAYER_DIED: return { appState: AppState.PLAYER_DEAD }
    case Event.ROUND_END: return { appState: AppState.GAME_LOBBY }
    case Event.ROUND_START: return { appState: AppState.GAME_PLAYING }
    case Event.ROUND_STARTED: return { appState: AppState.GAME_PLAYING }
    default: return null
  }
}

class App extends Component {
  state = {
    appState:    AppState.LOCKER_ROOM,
    fullscreen:  false,
    gameCode:    '',
    playerColor: null,
    error:       '',
  }

  componentDidMount = () => {
    this.alertIfNoRtc()
    const gameCode = getLastGameCode()
    this.setState({ gameCode })
  }

  onData = (message) => {
    const state = eventState(message)

    if (!state) {
      logError(`Unexpected event in message: ${message}`)
      return
    }

    this.setState(state)
  }

  onJoin = () => {
    navigator.vibrate(1)
    const { gameCode } = this.state
    this.setState({ appState: AppState.GAME_CONNECTING, error: '', fullscreen: true })
    setLastGameCode(gameCode)
    setTimeout(this.checkConnectionTimeout, TIMEOUT_SECONDS * 1000)
    this.connectToGame(gameCode)
  };

  displayError = (message) => {
    this.setState(errorState(message))
  }

  alertIfNoRtc = () => {
    if (typeof RTCPeerConnection === 'undefined') {
      const message =
        'Unfortunately the game cannot be played in this browser.' +
        'See list of supported browsers here: https://caniuse.com/#search=webrtc'

      // eslint-disable-next-line no-alert
      alert(message)
    }
  }

  gameCodeChange = ({ target: { value } }) =>
    this.setState({
      gameCode: value
        .substr(0, 4)
        .toUpperCase(),
    })

  checkConnectionTimeout = () => {
    if (this.state.appState === AppState.GAME_CONNECTING) {
      this.displayError('Failed to connect, try again!')
    }
  };

  connectToGame(gameCode) {
    const onClose = () => {
      this.displayError('Connection failed')
    }

    signaling.runInitiator({
      channelConfigs,
      onClose,
      onData:     this.onData,
      receiverId: gameCode,
      wsAddress:  WS_ADDRESS,
    })
      .then((send) => {
        this.sendSteering = send(Channel.RELIABLE_STEERING)
        this.sendReliable = send(Channel.RELIABLE)
      })
      .catch((error) => {
        const message = {
          NOT_FOUND: `Game with code ${gameCode} not found`,
        }[error.cause]

        if (message) {
          this.displayError(message)
        } else {
          logError(error)
        }
      })
  }

  clearError = () => {
    this.setState({ error: '' })
  }

  startGame = () => {
    this.sendReliable({ event: Event.ROUND_START })
    this.setState({ appState: AppState.GAME_PLAYING })
  }

  enableFullscreen = () => this.state.fullscreen && isMobileDevice()

  render() {
    if (!WS_ADDRESS) {
      // eslint-disable-next-line fp/no-throw
      throw new Error('Please set env variable REACT_APP_WS_ADDRESS')
    }

    const {
      error,
      gameCode,
      appState,
      playerColor,
      playerCount,
    } = this.state

    return (
      <Fullscreen
        enabled={this.enableFullscreen()}
        onChange={fullscreen => this.setState({ fullscreen })}
      >
        {
          appState === AppState.LOCKER_ROOM
            ?
              <LockerRoom
                clearError={this.clearError}
                error={error}
                gameCodeChange={this.gameCodeChange}
                gameCode={gameCode}
                onJoin={this.onJoin}
              />
            : null
        }
        {
          appState === AppState.GAME_CONNECTING
            ? <LockerRoomLoader />
            : null
        }
        {
          appState === AppState.GAME_LOBBY
            ?
              <GameLobby
                startGame={this.startGame}
                playerColor={playerColor}
                playerCount={playerCount}
              />
            : null
        }
        {
          appState === AppState.GAME_PLAYING
            ?
              <GamePlaying
                send={this.sendSteering}
                playerColor={Color[playerColor]}
              />
            : null
        }
        {
          appState === AppState.PLAYER_DEAD
            ?
              <PlayerDead
                playerColor={Color[playerColor]}
              />
            : null
        }
        {
          appState === AppState.AWAITING_NEXT_ROUND
            ?
              <AwatingNextRound
                playerColor={Color[playerColor]}
              />
            : null
        }
      </Fullscreen>
    )
  }
}

export default App
