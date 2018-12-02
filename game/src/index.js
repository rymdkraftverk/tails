import * as l1 from 'l1'
import * as PIXI from 'pixi.js'
import 'pixi-particles'
import { Event, Channel } from 'common'
import R from 'ramda'
import * as Sentry from '@sentry/browser'
import signaling from 'signaling'
import { transitionToGameScene } from './game'
import { transitionToLobby, createLobbyPlayer } from './lobby'
import http from './http'
import Scene from './Scene'
import Layer from './constant/layer'
import fullscreenFadeInOut from './fullscreenFadeInOut'
import gameState, { getPlayer, CurrentState } from './gameState'
import { GAME_WIDTH, GAME_HEIGHT } from './constant/rendering'
import GameEvent from './constant/gameEvent'

const ERROR_LOGGING = process.env.ERROR_LOGGING || false
const WS_ADDRESS = process.env.WS_ADDRESS || 'ws://localhost:3000'

Sentry.init({
  dsn: ERROR_LOGGING
    ? 'https://093af386f1624489a442e1737bf04113@sentry.io/1325311'
    : '',
})

const FORCE_START_DELAY = 10000 // ten seconds
export const MAX_PLAYERS_ALLOWED = 10

const { log, warn } = console

const movePlayer = (pId, direction) => {
  const player = l1.get(pId)
  // This is needed since events might be sent during score screen when player does not exist
  if (player) {
    l1.get(pId).direction = direction
  }
}

const registerPlayerFinished = ({ l1: { id } }) => () => {
  gameState.lastRoundResult.playerFinishOrder =
    gameState.lastRoundResult.playerFinishOrder.concat([id])
}

const gameInShapeForNewRound = () =>
  [CurrentState.LOBBY, CurrentState.SCORE_OVERVIEW].includes(gameState.currentState)

const isReady = R.propEq('ready', true)
const getReadyCount = () => R.filter(isReady, gameState.players).length
const allReady = () => R.all(isReady, gameState.players)

const scheduleForceStartEnablement = () => {
  setTimeout(
    () => {
      // bail if new round has already been started
      if (!gameInShapeForNewRound()) {
        return
      }
      broadcast({ event: Event.START_ENABLED })
    },
    FORCE_START_DELAY,
  )
}

const readyPlayer = (id) => {
  getPlayer(id).ready = true

  if (getReadyCount() === 1) {
    scheduleForceStartEnablement()
  } else if (allReady()) {
    roundStart()
  }
}

const roundStart = (options = { collectMetrics: false }) => {
  const { collectMetrics } = options

  if (gameInShapeForNewRound()) {
    gameState
      .players
      .forEach(({ playerId }) => {
        getPlayer(playerId)
          .send(Channel.RELIABLE, {
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
      .then(() => (collectMetrics ? initMetricsBehavior(app) : Promise.resolve()))
  }
}

const createGame = ({ gameCode }) => {
  gameState.gameCode = gameCode
  transitionToLobby(gameState.gameCode)
}

const onPlayerData = id => (message) => {
  const { event, payload } = message

  switch (event) {
    case Event.PLAYER_MOVEMENT:
      movePlayer(id, payload)
      break
    case Event.PLAYER_READY:
      readyPlayer(id)
      break
    case Event.ROUND_START:
      roundStart()
      break
    default:
      warn(`Unhandled event for message: ${message}`)
  }
}

const broadcast = (message) => {
  gameState
    .players
    .forEach((c) => {
      c.send(
        Channel.RELIABLE,
        message,
      )
    })
}

const morePlayersAllowed = () =>
  gameState.players.length < MAX_PLAYERS_ALLOWED

export const onPlayerJoin = ({
  id,
  setOnData,
  send,
  close,
}) => {
  if (!morePlayersAllowed()) {
    send(Channel.RELIABLE, {
      event:   Event.GAME_FULL,
      payload: {},
    })

    close()
    return
  }

  const player = createNewPlayer({
    playerId: id,
    send,
  })

  if (l1.get(Scene.LOBBY)) {
    const numOfPlayers = gameState.players.length
    createLobbyPlayer(player, numOfPlayers - 1, { newPlayer: true })
  }

  send(Channel.RELIABLE, {
    event:   Event.PLAYER_JOINED,
    payload: {
      playerId: id,
      color:    player.color,
      started:  gameState.currentState === CurrentState.PLAYING_ROUND,
    },
  })

  broadcast({
    event:   Event.PLAYER_COUNT,
    payload: gameState.players.length,
  })

  setOnData(onPlayerData(id))
}

const createNewPlayer = ({ playerId, send }) => {
  const [color] = gameState.availableColors
  gameState.availableColors = gameState.availableColors.filter(c => c !== color)
  const player = {
    playerId,
    spriteId: `square-${color}`,
    score:    0,
    color,
    send,
  }

  gameState.players = gameState.players.concat(player)
  return player
}

const onPlayerLeave = (id) => {
  log(`[Player Leave] ${id}`)

  const player = getPlayer(id)
  gameState.availableColors = [player.color].concat(gameState.availableColors)
  gameState.players = R.reject(R.propEq('playerId', id), gameState.players)

  if (gameState.currentState === CurrentState.LOBBY) {
    l1
      .getByLabel('lobby-square')
      .forEach(l1.destroy)

    gameState
      .players
      .forEach((p, i) => {
        createLobbyPlayer(p, i, { newPlayer: false })
      })
  }

  broadcast({
    event:   Event.PLAYER_COUNT,
    payload: gameState.players.length,
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
  debug:   false,
  logging: false,
})

app.loader.add('assets/spritesheet.json')
app.loader.add('assets/patchy-robots.ttf')

app.loader.load(() => {
  http.createGame()
    .then(({ gameCode }) => {
      createGame({ gameCode })
      log(`[Game created] ${gameCode}`)

      signaling.runReceiver({
        wsAddress:        WS_ADDRESS,
        receiverId:       gameCode,
        onInitiatorJoin:  onPlayerJoin,
        onInitiatorLeave: onPlayerLeave,
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

const initMetricsBehavior = (appReference) => {
  let metrics = []

  l1.addBehavior({
    onUpdate: () => {
      metrics = metrics.concat({
        pixiElapsedMS:  appReference.ticker.elapsedMS,
        displayObjects: l1.getAll().length,
        l1LoopDuration: l1.getLoopDuration(),
      })
    },
  })

  gameState
    .events
    .on(GameEvent.ROUND_END, () => {
      const csv = formatMetricsCSV(metrics)

      const encodedUri = encodeURI(`data:text/csv;charset=utf-8,\n${csv}`)
      const link = document.createElement('a')
      link.setAttribute('href', encodedUri)
      link.setAttribute('download', 'metrics.csv')
      document.body.appendChild(link)

      link.click()
    })
}

// [{ displayObjects, pixiElapsedMS, l1LoopDuration }] -> String
const formatMetricsCSV = R.pipe(
  R.groupBy(R.prop('displayObjects')),
  R.values,
  R.map((displayObjectMeasurements) => {
    const count = displayObjectMeasurements.length

    return R.pipe(
      R.reduce(R.mergeWith(R.add), {}),
      R.map(R.flip(R.divide)(count)),
    )(displayObjectMeasurements)
  }),
  R.reduce(
    (str, { pixiElapsedMS, displayObjects, l1LoopDuration }) =>
      `${str}\n${displayObjects}, ${pixiElapsedMS}, ${l1LoopDuration}`,
    'DisplayObjects, PixiElapsedMS, L1LoopDuration',
  ),
)

window.debug = {
  ...window.debug,
  roundStart,
  roundStartMetrics: () => roundStart({ collectMetrics: true }),
  printBehaviors,
  start,
  stop,
}
