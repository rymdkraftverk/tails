import React, { Component } from 'react'
import Fullscreen from 'react-full-screen'
import { EVENTS, COLORS } from 'common'

import LockerRoom from './LockerRoom'
import LockerRoomLoader from './LockerRoomLoader'
import GameLobby from './GameLobby'
import GamePlaying from './GamePlaying'
import signal from './signal'

const { log } = console

const { REACT_APP_WS_ADDRESS: WS_ADDRESS } = process.env
const TIMEOUT_SECONDS = 20

log('REACT_APP_WS_ADDRESS', WS_ADDRESS)

const APP_STATE = {
  LOCKER_ROOM:     'locker-room',
  GAME_CONNECTING: 'game-connecting',
  GAME_LOBBY:      'game-lobby',
  GAME_PLAYING:    'game-playing',
}

const { warn } = console

const isMobileDevice = () => (typeof window.orientation !== 'undefined') || (navigator.userAgent.indexOf('IEMobile') !== -1)

const getLastGameCode = () => {
  const gameCode = localStorage.getItem('gameCode')
  return gameCode || ''
}

const setLastGameCode = (gameCode) => {
  localStorage.setItem('gameCode', gameCode)
  return gameCode
}

/* eslint-disable-next-line fp/no-class */
class App extends Component {
  state = {
    appState:    APP_STATE.LOCKER_ROOM,
    fullscreen:  false,
    gameCode:    '',
    channel:     null,
    playerId:    null,
    playerColor: null,
    error:       '',
  }

  connectToGame(gameCode) {
    signal({
      wsAdress:   WS_ADDRESS,
      receiverId: gameCode,
    }).then(({ setOnData, send }) => {
      setOnData(this.onReceiverData)
      this.send = send
    }).catch(({ cause }) => {
      const message = {
        NOT_FOUND: `Game with code ${gameCode} not found`,
      }[cause]

      warn(message)
      this.setState({ appState: APP_STATE.LOCKER_ROOM, error: message })
    })
  }

  onReceiverData = ({ event, payload }) => {
    if (event === EVENTS.RTC.CONTROLLER_COLOR) {
      this.setState({
        appState:    APP_STATE.GAME_LOBBY,
        playerColor: payload.color,
        playerId:    payload.playerId,
      })
    } else if (event === EVENTS.RTC.GAME_START) {
      this.setState({
        appState: APP_STATE.GAME_PLAYING,
      })
    } else if (event === EVENTS.RTC.GAME_STARTED) {
      this.setState({
        appState: APP_STATE.GAME_PLAYING,
      })
    } else if (event === EVENTS.RTC.GAME_OVER) {
      this.setState({
        appState: APP_STATE.GAME_LOBBY,
      })
    }
  }

  componentDidMount() {
    const gameCode = getLastGameCode()
    this.setState({ gameCode })
  }

  gameCodeChange = ({ target: { value } }) => {
    this.setState({ gameCode: value.toUpperCase() })
  };

  checkConnectionTimeout = () => {
    if (this.state.appState === APP_STATE.GAME_CONNECTING) {
      this.setState({ appState: APP_STATE.LOCKER_ROOM, error: 'Failed to connect, try again!' })
    }
  };

  onJoin = () => {
    this.setState({ appState: APP_STATE.GAME_CONNECTING, error: '', fullscreen: true })
    setLastGameCode(this.state.gameCode)
    setTimeout(this.checkConnectionTimeout, TIMEOUT_SECONDS * 1000)
    this.connectToGame(this.state.gameCode)
  };

  clearError = () => {
    this.setState({ error: '' })
  }

  startGame = () => {
    this.send({ event: EVENTS.RTC.GAME_START })
    this.setState({ appState: APP_STATE.GAME_PLAYING })
  }

  enableFullscreen = () => this.state.fullscreen && isMobileDevice()

  render() {
    if (!WS_ADDRESS) {
      // eslint-disable-next-line fp/no-throw
      throw new Error('Please set env variable REACT_APP_WS_ADDRESS')
    }

    return (
      <Fullscreen
        style={{ touchAction: 'manipulation' }}
        enabled={this.enableFullscreen()}
        onChange={fullscreen => this.setState({ fullscreen })}>
        {
          this.state.appState === APP_STATE.LOCKER_ROOM
            ? <LockerRoom
                clearError={this.clearError}
                error={this.state.error}
                gameCodeChange={this.gameCodeChange}
                gameCode={this.state.gameCode}
                onJoin={this.onJoin} />
            : null
        }
        {
          this.state.appState === APP_STATE.GAME_CONNECTING
            ? <LockerRoomLoader />
            : null
        }
        {
          this.state.appState === APP_STATE.GAME_LOBBY
            ? <GameLobby
                startGame={this.startGame}
                playerColor={this.state.playerColor} />
            : null
        }
        {
          this.state.appState === APP_STATE.GAME_PLAYING
            ? <GamePlaying
                send={this.send}
                playerColor={COLORS[this.state.playerColor]} />
            : null
        }
      </Fullscreen>
    )
  }
}

export default App
