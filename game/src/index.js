// eslint-disable-next-line no-unused-vars
import { Game, Entity, Timer, Key, Debug, Gamepad, Physics, Sound, Net, Text, Util } from 'l1'
import EVENTS from '../../common/events'
import sprites from './sprites.json'
import { createLobby, addPlayerToLobby, players } from './lobby'
import { gameState } from './game'
import { connCreate, connSend, connClose } from './conn'

const WS_ADDRESS = process.env.WS_ADDRESS || 'ws://localhost:3000'
const HTTP_ADDRESS = process.env.HTTP_ADDRESS || 'http://localhost:3001'
const saveMetrics = require('./metrics')

const MAX_PLAYERS_ALLOWED = 10
export const LEFT = 'left'
export const RIGHT = 'right'

export const GAME_WIDTH = 1200
export const GAME_HEIGHT = 600

export const game = {
  started:                        false,
  gameCode:                       '',
  hasReceivedControllerCandidate: false,
  controllers:                    {
  },
  conn:       null,
  lastResult: {
    winner: null,
  },
  recordedCommands: {},
}

const movePlayer = (pId, direction) => {
  const playerEntity = Entity.get(`${pId}controller`)
  if (playerEntity) {
    playerEntity.direction = direction
  } else {
    /* eslint-disable-next-line no-console */
    console.log(`failed to move player ${pId} with direction ${direction}`)
  }
}

const moveLeft = playerId => movePlayer(playerId, LEFT)
const moveRight = playerId => movePlayer(playerId, RIGHT)
const moveStraight = playerId => movePlayer(playerId, null)

const playerMovement = (conn, controllerId, { command, ordering, timestamp }) => {
  console.log('time diff:', new Date().getTime() - timestamp)
  const move = {
    ordering,
    command,
    timestamp: new Date().getTime(),
  }

  game.recordedCommands[controllerId].push(move)

  if (game.controllers[controllerId].lastOrder >= ordering) {
    log(`dropping old move: ${ordering}`)
    return
  }

  game.controllers[controllerId].lastMoveOrder = ordering
  const commandFn = commands[command]
  if (commandFn) {
    commandFn(controllerId)
  }
}

const playerJoined = (conn, controllerId) => {
  if (Object.keys(players).length < MAX_PLAYERS_ALLOWED && !game.started) {
    game.controllers[controllerId] = {
      controllerId,
      lastMoveOrder: -1,
    }
    const { color } = addPlayerToLobby({ playerId: controllerId })
    connSend(conn, controllerId, { event: 'player.joined', payload: { playerId: controllerId, color } })
  } else {
    connClose(conn, controllerId)
  }
}

const gameStart = (conn) => {
  game.recordedCommands = {}

  if (!game.started) {
    Object
      .values(game.controllers)
      .forEach(({ controllerId }) => {
        game.recordedCommands[controllerId] = []
        connSend(conn, controllerId, { event: EVENTS.GAME_STARTED, payload: {} })
      })

    gameState()
    game.started = true
  }
}

const { log } = console

const playerCommandMetrics = (conn, controllerId, payload) =>
  saveMetrics(
    game.gameCode,
    controllerId,
    payload.color,
    payload.commands,
    game.recordedCommands[controllerId],
  )

const rtcEvents = {
  [EVENTS.PLAYER_MOVEMENT]:         playerMovement,
  [EVENTS.PLAYER_JOINED]:           playerJoined,
  [EVENTS.GAME_START]:              gameStart,
  [EVENTS.METRICS_PLAYER_COMMANDS]: playerCommandMetrics,
}

const commands = {
  [LEFT]:  moveLeft,
  [RIGHT]: moveRight,
  none:    moveStraight,
}

const onGameCreated = ({ gameCode }) => {
  game.gameCode = gameCode
  createLobby(game.gameCode)
}

const onData = (conn, controllerId, { event, payload }) => {
  log('onData =>', 'controllerId:', controllerId, 'data:', { event, payload })

  const eventFn = rtcEvents[event]
  if (eventFn) {
    eventFn(conn, controllerId, payload)
  }
}

Game.init(GAME_WIDTH, GAME_HEIGHT, sprites, { debug: false }).then(() => {
  const conn = connCreate(
    WS_ADDRESS,
    HTTP_ADDRESS,
    {
      onGameCreated,
      onData,
    },
  )
  game.conn = conn
  const background = Entity.create('background')
  Entity.addSprite(background, 'background', { zIndex: -999 })

  Key.add('up')
  Key.add('down')
  Key.add('left')
  Key.add('right')
})

// Enable the following behaviour for keyboard debugging

// const player1Keyboard = () => ({
//   run: () => {
//     if (Key.isDown('left')) {
//       Entity.get('player1controller').direction = LEFT
//     } else if (Key.isDown('right')) {
//       Entity.get('player1controller').direction = RIGHT
//     } else {
//       Entity.get('player1controller').direction = null
//     }
//   },
// })
