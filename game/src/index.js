import * as l1 from 'l1'
import * as PIXI from 'pixi.js'
import 'pixi-particles'
import { Event, Channel } from 'common'
import R from 'ramda'
import signaling from 'signaling'
import { transitionToGameScene } from './game'
import { transitionToLobby, createPlayerEntity } from './lobby'
import http from './http'
import Scene from './Scene'
import Layer from './util/layer'
import fullscreenFadeInOut from './fullscreenFadeInOut'
import gameState, { CurrentState } from './gameState'
import { GAME_WIDTH, GAME_HEIGHT } from './rendering'
import GameEvent from './util/gameEvent'

const WS_ADDRESS = process.env.WS_ADDRESS || 'ws://localhost:3000'

export const MAX_PLAYERS_ALLOWED = 10

const { log, warn } = console

const movePlayer = (pId, direction) => {
  const player = l1.get(pId)
  // This is needed since events might be sent during score screen when player does not exist
  if (player) {
    l1.get(pId).direction = direction
  }
}

export const playerCount = R.compose(R.length, R.values)

const registerPlayerFinished = ({ l1: { id } }) => () => {
  gameState.lastRoundResult.playerFinishOrder =
    gameState.lastRoundResult.playerFinishOrder.concat([id])
}

const roundStart = () => {
  if (gameState.currentState === CurrentState.LOBBY
    || gameState.currentState === CurrentState.SCORE_OVERVIEW) {
    Object
      .values(gameState.controllers)
      .forEach(({ id }) => {
        gameState.controllers[id].send(Channel.RELIABLE, {
          event:   Event.ROUND_STARTED,
          payload: {},
        })
      })

    fullscreenFadeInOut()
      .then(() => {
        const entitiesToKeep = [
          'background',
          'fadeInOut',
          'gameMusic',
        ]
        l1
          .getAll()
          .filter(e => !entitiesToKeep.includes(e.l1.id))
          .forEach(l1.destroy)

        transitionToGameScene(MAX_PLAYERS_ALLOWED)

        gameState.lastRoundResult.playerFinishOrder = []
        l1
          .getByLabel('player')
          .forEach(player =>
            player.event.on(GameEvent.PLAYER_COLLISION, registerPlayerFinished(player)))
      })
  }
}

const createGame = ({ gameCode }) => {
  gameState.gameCode = gameCode
  transitionToLobby(gameState.gameCode)
}

const onControllerData = id => (message) => {
  const { event, payload } = message

  switch (event) {
    case Event.PLAYER_MOVEMENT:
      movePlayer(id, payload)
      break
    case Event.ROUND_START:
      roundStart()
      break
    default:
      warn(`Unhandled event for message: ${message}`)
  }
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
      send,
    }

    send(Channel.RELIABLE, {
      event:   Event.CONTROLLER_COLOR,
      payload: {
        playerId: id,
        color:    player.color,
        started:  gameState.currentState === CurrentState.PLAYING_ROUND,
      },
    })

    broadcast({
      event:   Event.A_PLAYER_JOINED,
      payload: {
        playerCount: playerCount(gameState.players),
      },
    })
  } else {
    send(Channel.RELIABLE, {
      event:   Event.GAME_FULL,
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
      .getByLabel('lobby-square')
      .forEach(l1.destroy)

    Object
      .values(gameState.players)
      .forEach((p, i) => {
        createPlayerEntity(p, i, { newPlayer: false })
      })
  }

  broadcast({
    event:   Event.A_PLAYER_LEFT,
    payload: {
      playerCount: playerCount(gameState.players),
    },
  })
}

export const app = new PIXI.Application({
  width:             GAME_WIDTH,
  height:            GAME_HEIGHT,
  antialias:         true,
  clearBeforeRender: false,
})

document
  .getElementById('game')
  .appendChild(app.view)

l1.init(app, {
  debug: false,
})

app.loader.add('assets/spritesheet.json')

app.loader.load(() => {
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

  const background = new PIXI.Sprite(l1.getTexture('background'))

  background.scale.set(10)

  l1.add(background, {
    id:     'background',
    zIndex: Layer.ABSOLUTE_BACKGROUND,
  })
})

const resizeGame = () => {
  const screenWidth = window.innerWidth
  const screenHeight = window.innerHeight
  l1.resize(screenWidth, screenHeight)
}
resizeGame()

window.addEventListener('resize', resizeGame)

const printBehaviors = () => {
  log('BEHAVIORS:')
  l1.getAllBehaviors()
    .forEach((b) => {
      log(b.id)
    })
  log('==============')
}

const start = () => {
  app.ticker.start()
}

const stop = () => {
  app.ticker.stop()
}

window.debug = {
  ...window.debug,
  roundStart,
  printBehaviors,
  start,
  stop,
}
