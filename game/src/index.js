import { Game, Entity, Sprite, Key, PIXI } from 'l1'
import { Event, prettyId, Color, Channel, SteeringCommand } from 'common'
import R from 'ramda'
import signaling from 'signaling'
import { transitionToGameScene, GameEvent } from './game'
import { transitionToLobby, createPlayerEntity } from './lobby'
import http from './http'
import Scene from './Scene'
import layers from './util/layers'
import fullscreenFadeInOut from './fullscreenFadeInOut'
import gameState from './gameState'
import { GAME_WIDTH, GAME_HEIGHT } from './renderingConstant'

const WS_ADDRESS = process.env.WS_ADDRESS || 'ws://localhost:3000'

export const MAX_PLAYERS_ALLOWED = 10

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

const moveLeft = playerId => movePlayer(playerId, SteeringCommand.LEFT)
const moveRight = playerId => movePlayer(playerId, SteeringCommand.RIGHT)
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
        gameState.controllers[id].send(Channel.RELIABLE, {
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
  [SteeringCommand.LEFT]:  moveLeft,
  [SteeringCommand.RIGHT]: moveRight,
  [SteeringCommand.None]:  moveStraight,
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
  playerCount(gameState.players) < MAX_PLAYERS_ALLOWED

export const onControllerJoin = ({
  id,
  setOnData,
  send,
  close,
}) => {
  if (moreControllersAllowed()) {
    const player = createNewPlayer({ playerId: id })

    if (Entity.get(Scene.LOBBY)) {
      const numOfPlayers = playerCount(gameState.players)
      createPlayerEntity(player, numOfPlayers - 1, { newPlayer: true })
    }

    // If send is undefined we are trying to generate a mock player with window.debug
    if (!send) {
      return
    }

    gameState.controllers[id] = {
      id,
      lastMoveOrder: -1,
      send,
    }

    send(Channel.RELIABLE, {
      event:   Event.Rtc.CONTROLLER_COLOR,
      payload: {
        playerId: id,
        color:    player.color,
        started:  gameState.started,
      },
    })
  } else {
    close()
  }

  setOnData(onControllerData(id))
}

const createNewPlayer = ({ playerId }) => {
  const numOfPlayers = playerCount(gameState.players)
  const color = Object.keys(Color)[numOfPlayers]
  const player = {
    playerId,
    spriteId: `square-${color}`,
    score:    0,
    color,
  }

  gameState.players[player.playerId] = player
  return player
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
      options:  { antialias: true },
      settings: { SCALE_MODE: PIXI.SCALE_MODES.LINEAR },
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
    Sprite.show(background, { texture: 'background', zIndex: layers.ABSOLUTE_BACKGROUND })

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
