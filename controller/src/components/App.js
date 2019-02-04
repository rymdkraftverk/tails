import React, { Component } from 'react'
import Fullscreen from 'react-full-screen'
import { Event, Color, Channel } from 'common'
import signaling from 'signaling'

import channelConfigs from '../channelConfigs'
import LockerRoom from './LockerRoom'
import LockerRoomLoader from './LockerRoomLoader'
import GameLobby from './GameLobby'
import GamePlaying from './GamePlaying'
import AwaitingNextRound from './AwaitingNextRound'
import PlayerDead from './PlayerDead'
import isMobileDevice from '../util/isMobileDevice'
import { getLastGameCode, setLastGameCode } from '../util/localStorage'
import getUrlParams from '../util/getUrlParams'

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

const joinState = ({ started, color }) => (
  {
    ...newRoundState,
    playerColor: color,
    appState: started
      ? AppState.AWAITING_NEXT_ROUND
      : AppState.GAME_LOBBY,
  }
)

const newRoundState = {
  appState: AppState.GAME_LOBBY,
  ready: false,
  startEnabled: false,
}

const errorState = message => ({
  appState: AppState.LOCKER_ROOM,
  error:    message,
})

const getGameCodeFromUrl = () => getUrlParams(window.location.search).code
const writeGameCodeToUrl = (gameCode) => {
  window.history.pushState({ gameCode }, '', `?code=${gameCode}`)
}

const eventState = ({ event, payload }) => {
  switch (event) {
    case Event.PLAYER_COUNT: return { playerCount: payload }
    case Event.PLAYER_JOINED: return joinState(payload)
    case Event.START_ENABLED: return { startEnabled: true }
    case Event.GAME_FULL: return errorState('Game is full')
    case Event.PLAYER_DIED: return { appState: AppState.PLAYER_DEAD }
    case Event.ROUND_END: return newRoundState
    case Event.ROUND_STARTED: return { appState: AppState.GAME_PLAYING }
    default: return null
  }
}

class App extends Component {
  state = {
    appState:    AppState.LOCKER_ROOM,
    error:       '',
    fullscreen:  false,
    gameCode:    '',
    gyro:        false,
    playerColor: null,
    ready:       false,
  }

  componentDidMount = () => {
    this.alertIfNoRtc()
    const codeFromUrl = getGameCodeFromUrl()
    const gameCode = codeFromUrl || getLastGameCode()
    this.setState({ gameCode }, () => {
      if (codeFromUrl) {
        this.onJoin()
      }
    })
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
    navigator.vibrate(1) // To trigger accept dialog in firefox
    const { gameCode } = this.state
    this.setState({ appState: AppState.GAME_CONNECTING, error: '', fullscreen: true })
    setLastGameCode(gameCode)
    setTimeout(this.checkConnectionTimeout, TIMEOUT_SECONDS * 1000)
    writeGameCodeToUrl(gameCode)
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
      this.displayError('Connection failed, try joining Wi-Fi!')
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
  }

  readyPlayer = () => {
    this.sendReliable({ event: Event.PLAYER_READY })
    this.setState({ ready: true })
  }

  setGyro = (gyro) => {
    this.setState({ gyro })
  }

  enableFullscreen = () => this.state.fullscreen && isMobileDevice()

  appStateComponent = () => {
    const {
      appState,
      error,
      gameCode,
      gyro,
      playerColor,
      playerCount,
      ready,
      startEnabled,
    } = this.state

    switch (appState) {
      case AppState.LOCKER_ROOM: 
        return <LockerRoom
         clearError={this.clearError}
         error={error}
         gameCodeChange={this.gameCodeChange}
         gameCode={gameCode}
         onJoin={this.onJoin}
        />
      case AppState.GAME_CONNECTING: 
        return <LockerRoomLoader />
      case AppState.GAME_LOBBY: 
        return <GameLobby
          startGame={this.startGame}
          readyPlayer={this.readyPlayer}
          playerColor={playerColor}
          playerCount={playerCount}
          ready={ready}
          startEnabled={startEnabled}
        />
      case AppState.GAME_PLAYING: 
        return <GamePlaying
          gyro={gyro}
          playerColor={Color[playerColor]}
          send={this.sendSteering}
          setGyro={this.setGyro}
        />
      case AppState.PLAYER_DEAD: 
        return <PlayerDead
          playerColor={Color[playerColor]}
        />
      case AppState.AWAITING_NEXT_ROUND: 
        return <AwaitingNextRound
          playerColor={Color[playerColor]}
        />
      default: return null
    }
  }

  render() {
    if (!WS_ADDRESS) {
      // eslint-disable-next-line fp/no-throw
      throw new Error('Please set env variable REACT_APP_WS_ADDRESS')
    }

    return (
      <Fullscreen
        enabled={this.enableFullscreen()}
        onChange={fullscreen => this.setState({ fullscreen })}
      >
      { this.appStateComponent() }
      </Fullscreen>
    )
  }
}

export default App
