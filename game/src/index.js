import l1 from 'l1'
import { Event, Channel, SteeringCommand } from 'common'
import { prettyId } from 'signaling/common'
import R from 'ramda'
import signaling from 'signaling'
import { transitionToGameScene, GameEvent } from './game'
import { transitionToLobby, createPlayerEntity } from './lobby'
import http from './http'
import Scene from './Scene'
import Layer from './util/layer'
import fullscreenFadeInOut from './fullscreenFadeInOut'
import gameState, { CurrentState } from './gameState'
import { GAME_WIDTH, GAME_HEIGHT } from './rendering'

const WS_ADDRESS = process.env.WS_ADDRESS || 'ws://localhost:3000'

export const MAX_PLAYERS_ALLOWED = 10

const movePlayer = (pId, direction) => {
  const playerEntity = l1.get(`${pId}controller`)
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
  if (gameState.currentState === CurrentState.LOBBY
    || gameState.currentState === CurrentState.SCORE_OVERVIEW) {
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
        const entitiesToKeep = [
          'background',
          'fadeInOut',
        ]

        l1
          .getAllEntities()
          .filter(e => !entitiesToKeep.includes(e.id))
          .forEach(l1.destroy)
        transitionToGameScene(MAX_PLAYERS_ALLOWED)

        gameState.lastRoundResult.playerFinishOrder = []
        l1
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
  [SteeringCommand.NONE]:  moveStraight,
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

const broadcast = (message) => {
  Object.values(gameState.controllers)
    .forEach((c) => {
      c.send(
        Channel.RELIABLE,
        message,
      )
    })
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

    if (l1.get(Scene.LOBBY)) {
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
        started:  gameState.currentState === CurrentState.PLAYING_ROUND,
      },
    })

    broadcast({
      event:   Event.Rtc.A_PLAYER_JOINED,
      payload: {
        playerCount: playerCount(gameState.players),
      },
    })
  } else {
    send(Channel.RELIABLE, {
      event:   Event.Rtc.GAME_FULL,
      payload: {},
    })

    close()
  }

  setOnData(onControllerData(id))
}

const createNewPlayer = ({ playerId }) => {
  const [color] = gameState.availableColors
  gameState.availableColors = gameState.availableColors.filter(c => c !== color)
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
  gameState.controllers = R.pickBy((_val, key) => key !== id, gameState.controllers)

  const player = gameState.players[id]
  gameState.availableColors = [player.color].concat(gameState.availableColors)
  gameState.players = R.pickBy((_val, key) => key !== id, gameState.players)

  if (gameState.currentState === CurrentState.LOBBY) {
    l1
      .getByType('lobby-square')
      .forEach(l1.destroy)

    Object
      .values(gameState.players)
      .forEach((p, i) => {
        createPlayerEntity(p, i, { newPlayer: false })
      })
  }

  broadcast({
    event:   Event.Rtc.A_PLAYER_LEFT,
    payload: {
      playerCount: playerCount(gameState.players),
    },
  })
}

const resizeGame = () => {
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  l1.resize(screenWidth, screenHeight)
}

window.addEventListener('resize', resizeGame)

l1
  .init({
    width:   GAME_WIDTH,
    height:  GAME_HEIGHT,
    debug:   false,
    element: document.getElementById('game'),
    pixi:    {
      options:  { antialias: true },
      settings: { SCALE_MODE: l1.PIXI.SCALE_MODES.LINEAR },
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

    l1.sprite({
      id:      'background',
      texture: 'background',
      zIndex:  Layer.ABSOLUTE_BACKGROUND,
    })

    resizeGame()
  })

window.debug = {
  ...window.debug,
  roundStart,
}
