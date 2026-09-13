import { useReducer } from 'react'
import MediaQuery from 'react-responsive'
import { Event, Color, Channel } from 'common'
import { useJoin } from 'rkv-signaling/react'
import * as Sentry from '@sentry/browser'

import channelConfigs from '../channelConfigs'
import LockerRoom from './LockerRoom'
import LockerRoomLoader from './LockerRoomLoader'
import GameLobby from './GameLobby'
import GamePlaying from './GamePlaying'
import AwaitingNextRound from './AwaitingNextRound'
import PlayerDead from './PlayerDead'
import TurnPhone from './TurnPhone'
import Gyro from './Gyro'
import Toast from './Toast'

const { error: logError } = console

const WS_ADDRESS = process.env.REACT_APP_WS_ADDRESS

const Screen = {
  GAME_LOBBY: 'game-lobby',
  GAME_PLAYING: 'game-playing',
  PLAYER_DEAD: 'player-dead',
  AWAITING_NEXT_ROUND: 'awaiting-next-round',
} as const

type ScreenValue = (typeof Screen)[keyof typeof Screen]

type Game = {
  angle: number
  gyro: boolean
  playerColor: keyof typeof Color | null
  playerCount?: number
  ready: boolean
  screen: ScreenValue
  startEnabled: boolean
}

const initialGame: Game = {
  angle: 0,
  gyro: false,
  playerColor: null,
  ready: false,
  screen: Screen.GAME_LOBBY,
  startEnabled: false,
}

const newRound = {
  screen: Screen.GAME_LOBBY,
  ready: false,
  startEnabled: false,
}

const joined = ({
  started,
  color,
}: {
  started: boolean
  color: keyof typeof Color
}) => ({
  ...newRound,
  playerColor: color,
  screen: started ? Screen.AWAITING_NEXT_ROUND : Screen.GAME_LOBBY,
})

const eventChange = ({
  event,
  payload,
}: {
  event: string
  payload: never
}): Partial<Game> | null => {
  switch (event) {
    case Event.PLAYER_COUNT:
      return { playerCount: payload }
    case Event.PLAYER_JOINED:
      return joined(payload)
    case Event.START_ENABLED:
      return { startEnabled: true }
    case Event.PLAYER_DIED:
      return { screen: Screen.PLAYER_DEAD }
    case Event.ROUND_END:
      return newRound
    case Event.ROUND_STARTED:
      return { screen: Screen.GAME_PLAYING }
    default:
      return null
  }
}

const merge = (game: Game, change: Partial<Game>) => ({ ...game, ...change })

function App() {
  const [game, change] = useReducer(merge, initialGame)

  const onData = (message: { event: string; payload: never }) => {
    if (message.event === Event.GAME_FULL) {
      fail('Game is full')
      return
    }

    const next = eventChange(message)

    if (!next) {
      logError(`Unexpected event in message: ${message}`)
      return
    }

    change(next)
  }

  const {
    status,
    gameCode,
    setGameCode,
    notice,
    dismissNotice,
    join,
    fail,
    send,
  } = useJoin({
    wsAddress: WS_ADDRESS as string,
    channelConfigs,
    onData,
    onTimeout: () => {
      Sentry.captureMessage('Controller connection timeout')
    },
  })

  const sendSteering = (message: object) =>
    send(Channel.RELIABLE_STEERING, message)
  const sendReliable = (message: object) => send(Channel.RELIABLE, message)

  const gameCodeChange = ({
    target: { value },
  }: React.ChangeEvent<HTMLInputElement>) => {
    setGameCode(value)
  }

  const startGame = () => {
    sendReliable({ event: Event.ROUND_START })
  }

  const readyPlayer = () => {
    sendReliable({ event: Event.PLAYER_READY })
    change({ ready: true })
  }

  const screen = () => {
    const { angle, gyro, playerColor, playerCount, ready, startEnabled } = game

    if (status === 'lobby') {
      return (
        <LockerRoom
          gameCodeChange={gameCodeChange}
          gameCode={gameCode}
          onJoinClick={join}
        />
      )
    }

    // Every screen past the lobby is only reachable once the game has
    // assigned this player a colour
    if (status === 'connecting' || !playerColor) {
      return <LockerRoomLoader />
    }

    switch (game.screen) {
      case Screen.GAME_LOBBY:
        return (
          <GameLobby
            startGame={startGame}
            readyPlayer={readyPlayer}
            playerColor={playerColor}
            playerCount={playerCount}
            ready={ready}
            startEnabled={startEnabled}
          />
        )
      case Screen.GAME_PLAYING:
        return (
          <GamePlaying
            angle={angle}
            gyro={gyro}
            playerColor={Color[playerColor]}
            send={sendSteering}
            setGyro={(value: boolean) => change({ gyro: value })}
          />
        )
      case Screen.PLAYER_DEAD:
        return (
          <PlayerDead
            sendReliable={sendReliable}
            playerColor={Color[playerColor]}
          />
        )
      case Screen.AWAITING_NEXT_ROUND:
        return <AwaitingNextRound playerColor={Color[playerColor]} />
      default:
        return null
    }
  }

  if (!WS_ADDRESS) {
    throw new Error('Please set env variable REACT_APP_WS_ADDRESS')
  }

  return (
    <>
      {notice && (
        <Toast
          key={notice.text}
          text={notice.text}
          type={notice.type}
          onHide={dismissNotice}
        />
      )}
      <Gyro
        send={sendSteering}
        enabled={game.gyro}
        setAngle={(angle: number) => change({ angle })}
      />
      <MediaQuery orientation="portrait">
        <TurnPhone />
      </MediaQuery>
      <MediaQuery orientation="landscape">{screen()}</MediaQuery>
    </>
  )
}

export default App
