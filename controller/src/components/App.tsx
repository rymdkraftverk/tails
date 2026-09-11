import { Component } from 'react'
import MediaQuery from 'react-responsive'
import { Event, Color, Channel, getUrlParams } from 'common'
import signaling from 'rkv-signaling'
import * as Sentry from '@sentry/browser'

import channelConfigs from '../channelConfigs'
import LockerRoom from './LockerRoom'
import LockerRoomLoader from './LockerRoomLoader'
import GameLobby from './GameLobby'
import GamePlaying from './GamePlaying'
import AwaitingNextRound from './AwaitingNextRound'
import PlayerDead from './PlayerDead'
import { getLastGameCode, setLastGameCode } from '../util/sessionStorage'
import TurnPhone from './TurnPhone'
import Gyro from './Gyro'
import Toast from './Toast'

const { error: logError } = console

const WS_ADDRESS = process.env.REACT_APP_WS_ADDRESS
const TIMEOUT_SECONDS = 20

const AppState = {
  LOCKER_ROOM: 'locker-room',
  GAME_CONNECTING: 'game-connecting',
  GAME_LOBBY: 'game-lobby',
  GAME_PLAYING: 'game-playing',
  PLAYER_DEAD: 'player-dead',
  AWAITING_NEXT_ROUND: 'awaiting-next-round',
} as const

type AppStateValue = (typeof AppState)[keyof typeof AppState]

type Notice = { text: string; type: 'error' | 'warning' }

type AppStateShape = {
  angle?: number
  appState: AppStateValue
  gameCode: string
  gyro: boolean
  notice: Notice | null
  playerColor: keyof typeof Color | null
  playerCount?: number
  ready: boolean
  startEnabled?: boolean
  sendSteering: (message: object) => void
  sendReliable: (message: object) => void
}

const newRoundState = {
  appState: AppState.GAME_LOBBY,
  ready: false,
  startEnabled: false,
}

const joinState = ({
  started,
  color,
}: {
  started: boolean
  color: keyof typeof Color
}) => ({
  ...newRoundState,
  playerColor: color,
  appState: started ? AppState.AWAITING_NEXT_ROUND : AppState.GAME_LOBBY,
})

const errorState = (message: string) => ({
  appState: AppState.LOCKER_ROOM,
  notice: { text: message, type: 'error' } as Notice,
})

const getGameCodeFromUrl = () => getUrlParams(window.location.search).code
const writeGameCodeToUrl = (gameCode: string) => {
  window.history.pushState({ gameCode }, '', `?code=${gameCode}`)
}

const eventState = ({ event, payload }: { event: string; payload: never }) => {
  switch (event) {
    case Event.PLAYER_COUNT:
      return { playerCount: payload }
    case Event.PLAYER_JOINED:
      return joinState(payload)
    case Event.START_ENABLED:
      return { startEnabled: true }
    case Event.GAME_FULL:
      return errorState('Game is full')
    case Event.PLAYER_DIED:
      return { appState: AppState.PLAYER_DEAD }
    case Event.ROUND_END:
      return newRoundState
    case Event.ROUND_STARTED:
      return { appState: AppState.GAME_PLAYING }
    default:
      return null
  }
}

class App extends Component<Record<string, never>, AppStateShape> {
  state: AppStateShape = {
    appState: AppState.LOCKER_ROOM,
    gameCode: '',
    gyro: false,
    notice: null,
    playerColor: null,
    ready: false,
    sendSteering: () => {},
    sendReliable: () => {},
  }

  componentDidMount() {
    this.alertIfNoRtc()
    this.warnIfCellular()
    const codeFromUrl = getGameCodeFromUrl()
    const gameCode = codeFromUrl || getLastGameCode()
    this.setState({ gameCode })
    if (codeFromUrl) {
      this.join(gameCode)
    }
  }

  onData = (message: { event: string; payload: never }) => {
    const state = eventState(message)

    if (!state) {
      logError(`Unexpected event in message: ${message}`)
      return
    }

    this.setState(state as Pick<AppStateShape, keyof AppStateShape>)
  }

  onJoinClick = () => {
    navigator.vibrate(1) // To trigger accept dialog in firefox
    const { gameCode } = this.state
    this.join(gameCode)
  }

  join = (gameCode: string) => {
    this.setState({ appState: AppState.GAME_CONNECTING, notice: null })
    setLastGameCode(gameCode)
    setTimeout(this.checkConnectionTimeout, TIMEOUT_SECONDS * 1000)
    writeGameCodeToUrl(gameCode)
    this.connectToGame(gameCode)
  }

  displayError = (message: string) => {
    this.setState(errorState(message))
  }

  warnIfCellular = () => {
    const connection =
      navigator.connection ||
      navigator.mozConnection ||
      navigator.webkitConnection

    if (connection && connection.type === 'cellular') {
      this.setState({
        notice: {
          text: 'Connect to WiFi for best experience',
          type: 'warning',
        },
      })
    }
  }

  alertIfNoRtc = () => {
    if (typeof RTCPeerConnection === 'undefined') {
      const message =
        'Unfortunately the game cannot be played in this browser.' +
        'See list of supported browsers here: https://caniuse.com/#search=webrtc'

      alert(message)
    }
  }

  gameCodeChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) =>
    this.setState({
      gameCode: value.substr(0, 4).toUpperCase(),
    })

  checkConnectionTimeout = () => {
    if (this.state.appState === AppState.GAME_CONNECTING) {
      this.displayError('Connection failed, joining Wi-Fi may help')
      Sentry.captureMessage('Controller connection timeout')
    }
  }

  connectToGame(gameCode: string) {
    const onClose = () => {
      this.displayError('Connection failed')
    }

    signaling
      .runInitiator({
        channelConfigs,
        onClose,
        onData: this.onData,
        receiverId: gameCode,
        wsAddress: WS_ADDRESS as string,
      })
      .then(send => {
        this.setState({
          sendSteering: send(Channel.RELIABLE_STEERING),
          sendReliable: send(Channel.RELIABLE),
        })
      })
      .catch((error: { cause?: string }) => {
        const message =
          error.cause === 'NOT_FOUND'
            ? `Game with code ${gameCode} not found`
            : undefined

        if (message) {
          this.displayError(message)
        } else {
          logError(error)
        }
      })
  }

  hideNotice = () => {
    this.setState({ notice: null })
  }

  startGame = () => {
    this.state.sendReliable({ event: Event.ROUND_START })
  }

  readyPlayer = () => {
    this.state.sendReliable({ event: Event.PLAYER_READY })
    this.setState({ ready: true })
  }

  setGyro = (gyro: boolean) => {
    this.setState({ gyro })
  }

  setAngle = (angle: number) => {
    this.setState({ angle })
  }

  appStateComponent = () => {
    const {
      angle = 0,
      appState,
      gameCode,
      gyro,
      playerColor,
      playerCount,
      ready,
      startEnabled = false,
      sendSteering,
      sendReliable,
    } = this.state

    // Every screen past the lobby is only reachable once the game has
    // assigned this player a colour
    if (
      !playerColor &&
      appState !== AppState.LOCKER_ROOM &&
      appState !== AppState.GAME_CONNECTING
    ) {
      return null
    }

    switch (appState) {
      case AppState.LOCKER_ROOM:
        return (
          <LockerRoom
            gameCodeChange={this.gameCodeChange}
            gameCode={gameCode}
            onJoinClick={this.onJoinClick}
          />
        )
      case AppState.GAME_CONNECTING:
        return <LockerRoomLoader />
      case AppState.GAME_LOBBY:
        return (
          <GameLobby
            startGame={this.startGame}
            readyPlayer={this.readyPlayer}
            playerColor={playerColor!}
            playerCount={playerCount}
            ready={ready}
            startEnabled={startEnabled}
          />
        )
      case AppState.GAME_PLAYING:
        return (
          <GamePlaying
            angle={angle}
            gyro={gyro}
            playerColor={Color[playerColor!]}
            send={sendSteering}
            setGyro={this.setGyro}
          />
        )
      case AppState.PLAYER_DEAD:
        return (
          <PlayerDead
            sendReliable={sendReliable}
            playerColor={Color[playerColor!]}
          />
        )
      case AppState.AWAITING_NEXT_ROUND:
        return <AwaitingNextRound playerColor={Color[playerColor!]} />
      default:
        return null
    }
  }

  render() {
    if (!WS_ADDRESS) {
      throw new Error('Please set env variable REACT_APP_WS_ADDRESS')
    }

    const { gyro, notice, sendSteering } = this.state

    return (
      <>
        {notice && (
          <Toast
            key={notice.text}
            text={notice.text}
            type={notice.type}
            onHide={this.hideNotice}
          />
        )}
        <Gyro send={sendSteering} enabled={gyro} setAngle={this.setAngle} />
        <MediaQuery orientation="portrait">
          <TurnPhone />
        </MediaQuery>
        <MediaQuery orientation="landscape">
          {this.appStateComponent()}
        </MediaQuery>
      </>
    )
  }
}

export default App
