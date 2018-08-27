import { Game, Entity, Sprite, Key } from 'l1'
import { Event, prettyId } from 'common'
import R from 'ramda'
import { EventEmitter } from 'eventemitter3'
import signaling from 'signaling'
import { transitionToGameScene, GameEvent } from './game'
import { transitionToLobby, addPlayerToLobby } from './lobby'
import http from './http'
import layers from './util/layers'
import fullscreenFadeInOut from './fullscreenFadeInOut'
import Scene from './Scene'
import { transitionToScoreScene } from './score'

const WS_ADDRESS = process.env.WS_ADDRESS || 'ws://localhost:3000'

export const MAX_PLAYERS_ALLOWED = 10
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
  events: new EventEmitter(),
}

const movePlayer = (pId, direction) => {
  const playerEntity = Entity.get(`${pId}controller`)
  if (playerEntity) {
    playerEntity.direction = direction
  } else {
    // TODO: stop sending useless movements event
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
    gameState.started = true

    Object
      .values(gameState.controllers)
      .forEach(({ id }) => {
        gameState.controllers[id].send({
          event:   Event.Rtc.ROUND_STARTED,
          payload: {},
        })
      })

    fullscreenFadeInOut()
      .then(() => {
        Entity
          .getAll()
          .filter(e => e.id !== 'background')
          .map(Entity.destroy)
        transitionToGameScene(MAX_PLAYERS_ALLOWED)

        gameState.lastRoundResult.playerFinishOrder = []
        Entity
          .getByType('player')
          .forEach(player =>
            player.event.on(GameEvent.PLAYER_COLLISION, registerPlayerFinished(player)))
      })
  }
}

const { log, warn } = console

const rtcEvents = {
  [Event.Rtc.PLAYER_MOVEMENT]: playerMovement,
  [Event.Rtc.ROUND_START]:     roundStart,
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
      event:   Event.Rtc.CONTROLLER_COLOR,
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

const resizeGame = () => {
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  Game.resize(screenWidth, screenHeight)
}

window.addEventListener('resize', resizeGame)

Game
  .init({
    width:   GAME_WIDTH,
    height:  GAME_HEIGHT,
    debug:   false,
    element: document.getElementById('game'),
    pixi:    {
      antialias: true,
    },
  })
  .then(() => {
    http.createGame()
      .then(({ gameCode }) => {
        createGame({ gameCode })
        log(`[Game created] ${gameCode}`)

        signaling.runReceiver({
          wsAddress:        WS_ADDRESS,
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

window.debug = {
  ...window.debug,
  roundStart,
}
