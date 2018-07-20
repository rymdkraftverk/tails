import { Game, Entity, Sprite, Key } from 'l1'
import { EVENTS, prettyId } from 'common'
import R from 'ramda'
import { transitionToGameScene, EVENTS as GAME_EVENTS } from './game'
import assets from './assets.json'
import { transitionToLobby, addPlayerToLobby } from './lobby'
import http from './http'
import signal from './signal'
import layers from './util/layers'

const WS_ADDRESS = process.env.WS_ADDRESS || 'ws://localhost:3000'

const MAX_PLAYERS_ALLOWED = 10
export const LEFT = 'left'
export const RIGHT = 'right'

export const GAME_WIDTH = 1280
export const GAME_HEIGHT = 720

export const gameState = {
  started:                        false,
  gameCode:                       '',
  hasReceivedControllerCandidate: false,
  // TODO: change to array
  controllers:                    {
  },
  players: {
  },
  lastRoundResult: {
    playerFinishOrder: [],
    winner:            null,
  },
}

const movePlayer = (pId, direction) => {
  const playerEntity = Entity.get(`${pId}controller`)
  if (playerEntity) {
    playerEntity.direction = direction
  } else {
    // TODO: stop sending useless movements events
    warn(`Failed to move player ${prettyId(pId)} with direction ${direction}`)
  }
}

export const playerCount = R.compose(R.length, R.values)

const moveLeft = playerId => movePlayer(playerId, LEFT)
const moveRight = playerId => movePlayer(playerId, RIGHT)
const moveStraight = playerId => movePlayer(playerId, null)

const registerPlayerFinished = ({ id }) => () => {
  gameState.lastRoundResult.playerFinishOrder =
    gameState.lastRoundResult.playerFinishOrder.concat([id])
}

const playerMovement = (id, { command, ordering }) => {
  if (gameState.controllers[id].lastOrder >= ordering) {
    log(`dropping old move: ${ordering}`)
    return
  }

  gameState.controllers[id].lastMoveOrder = ordering
  const commandFn = commands[command]
  if (commandFn) {
    commandFn(id)
  }
}

const roundStart = () => {
  if (!gameState.started) {
    Object
      .values(gameState.controllers)
      .forEach(({ id }) => {
        gameState.controllers[id].send({
          event:   EVENTS.RTC.ROUND_STARTED,
          payload: {},
        })
      })

    transitionToGameScene(MAX_PLAYERS_ALLOWED)
    gameState.started = true

    gameState.lastRoundResult.playerFinishOrder = []
    Entity
      .getByType('player')
      .forEach(player =>
        player.events.on(GAME_EVENTS.PLAYER_COLLISION, registerPlayerFinished(player)))
  }
}

const { log, warn } = console

const rtcEvents = {
  [EVENTS.RTC.PLAYER_MOVEMENT]: playerMovement,
  [EVENTS.RTC.ROUND_START]:     roundStart,
}

const commands = {
  [LEFT]:  moveLeft,
  [RIGHT]: moveRight,
  none:    moveStraight,
}

const createGame = ({ gameCode }) => {
  gameState.gameCode = gameCode
  transitionToLobby(gameState.gameCode)
}

// TODO: extract event switch logic to common function
const onControllerData = id => (message) => {
  const { event, payload } = message

  const f = rtcEvents[event]
  if (!f) {
    warn(`Unhandled event for message: ${message.data}`)
    return
  }

  f(id, payload)
}

const moreControllersAllowed = () =>
  playerCount(gameState.players) < MAX_PLAYERS_ALLOWED && !gameState.started

const onControllerJoin = ({
  id,
  setOnData,
  send,
  close,
}) => {
  if (moreControllersAllowed()) {
    gameState.controllers[id] = {
      id,
      lastMoveOrder: -1,
      send,
    }
    const { color } = addPlayerToLobby({ playerId: id })

    send({
      event:   EVENTS.RTC.CONTROLLER_COLOR,
      payload: {
        playerId: id,
        color,
      },
    })
  } else {
    close()
  }

  // TODO: rambdify
  setOnData(onControllerData(id))
}

const onControllerLeave = (id) => {
  log(`[Controller Leave] ${id}`)
  // delete game.controllers[id]
  // TODO: remove from controllers and lobby
}

let ratio
export const getRatio = () => ratio

const resizeGame = () => {
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  ratio = Math.min(screenWidth / GAME_WIDTH, screenHeight / GAME_HEIGHT)
  Game.getStage().scale.set(ratio)
  Game.getRenderer().resize(GAME_WIDTH * ratio, GAME_HEIGHT * ratio)

  // The following code is needed to couteract the scale change on the whole canvas since
  // texts get distorted by PIXI when you try to change their scale.
  // Texts instead change size by setting their fontSize.
  Entity.getAll()
    .forEach((e) => {
      // TODO: Export assettype constants from level1?
      if (e.originalSize) {
        e.asset.style.fontSize = e.originalSize * ratio
        e.asset.scale.set(1 / ratio)
      }
    })
}
window.addEventListener('resize', resizeGame)

Game.init({
  width:   GAME_WIDTH,
  height:  GAME_HEIGHT,
  assets,
  debug:   false,
  element: document.getElementById('game'),
}).then(() => {
  http.createGame()
    .then(({ gameCode }) => {
      createGame({ gameCode })
      log(`[Game created] ${gameCode}`)

      signal({
        wsAdress:         WS_ADDRESS,
        receiverId:       gameCode,
        onInitiatorJoin:  onControllerJoin,
        onInitiatorLeave: onControllerLeave,
      })
    })

  const background = Entity.addChild(Entity.getRoot(), { id: 'background' })
  Sprite.show(background, { texture: 'background', zIndex: layers.BACKGROUND })

  resizeGame()

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
