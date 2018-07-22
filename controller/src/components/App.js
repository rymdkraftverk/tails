import React, { Component } from 'react'
import Fullscreen from 'react-full-screen'
import { EVENTS, COLORS } from 'common'

import LockerRoom from './LockerRoom'
import LockerRoomLoader from './LockerRoomLoader'
import GameLobby from './GameLobby'
import GamePlaying from './GamePlaying'
import signal from '../signal'
import isMobileDevice from '../util/isMobileDevice'
import { getLastGameCode, setLastGameCode } from '../util/localStorage'

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

  componentDidMount = () => {
    navigator.vibrate(1)
  }

  connectToGame(gameCode) {
    signal({
      wsAdress:   WS_ADDRESS,
      receiverId: gameCode,
    }).then(({ setOnData, setOnClose, send }) => {
      setOnData(this.onReceiverData)

      setOnClose(() => {
        this.displayError('Connection closed')
      })

      this.send = send
    }).catch(({ cause }) => {
      const message = {
        NOT_FOUND: `Game with code ${gameCode} not found`,
      }[cause]

      this.displayError(message)
    })
  }

  onReceiverData = ({ event, payload }) => {
    if (event === EVENTS.RTC.CONTROLLER_COLOR) {
      this.setState({
        appState:    APP_STATE.GAME_LOBBY,
        playerColor: payload.color,
        playerId:    payload.playerId,
      })
    } else if (event === EVENTS.RTC.ROUND_START) {
      this.setState({
        appState: APP_STATE.GAME_PLAYING,
      })
    } else if (event === EVENTS.RTC.ROUND_STARTED) {
      this.setState({
        appState: APP_STATE.GAME_PLAYING,
      })
    } else if (event === EVENTS.RTC.ROUND_END) {
      this.setState({
        appState: APP_STATE.GAME_LOBBY,
      })
    }
  }

  componentDidMount() {
    const gameCode = getLastGameCode()
    this.setState({ gameCode })
  }

  displayError = (message) => {
    this.setState({ appState: APP_STATE.LOCKER_ROOM, error: message })
  }

  gameCodeChange = ({ target: { value } }) => {
    this.setState({ gameCode: value.toUpperCase() })
  };

  checkConnectionTimeout = () => {
    if (this.state.appState === APP_STATE.GAME_CONNECTING) {
      this.displayError('Failed to connect, try again!')
    }
  };

  onJoin = () => {
    const { gameCode } = this.state
    this.setState({ appState: APP_STATE.GAME_CONNECTING, error: '', fullscreen: true })
    setLastGameCode(gameCode)
    setTimeout(this.checkConnectionTimeout, TIMEOUT_SECONDS * 1000)
    this.connectToGame(gameCode)
  };

  clearError = () => {
    this.setState({ error: '' })
  }

  startGame = () => {
    this.send({ event: EVENTS.RTC.ROUND_START })
    this.setState({ appState: APP_STATE.GAME_PLAYING })
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
    } = this.state

    return (
      <Fullscreen
        style={{ touchAction: 'manipulation' }}
        enabled={this.enableFullscreen()}
        onChange={fullscreen => this.setState({ fullscreen })}
      >
        {
          appState === APP_STATE.LOCKER_ROOM
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
          appState === APP_STATE.GAME_CONNECTING
            ? <LockerRoomLoader />
            : null
        }
        {
          appState === APP_STATE.GAME_LOBBY
            ?
              <GameLobby
                startGame={this.startGame}
                playerColor={playerColor}
              />
            : null
        }
        {
          appState === APP_STATE.GAME_PLAYING
            ?
              <GamePlaying
                send={this.send}
                playerColor={COLORS[playerColor]}
              />
            : null
        }
      </Fullscreen>
    )
  }
}

export default App
