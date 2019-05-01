import * as l1 from 'l1'
import * as PIXI from 'pixi.js'
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
import { State, state } from './state'
import playerRepository from './repository/player'
import { GAME_WIDTH, GAME_HEIGHT } from './constant/rendering'
import GameEvent from './constant/gameEvent'
import playerDead from './playerDead'
import * as qrCode from './qrCode'

const ERROR_LOGGING = process.env.ERROR_LOGGING || false
const WS_ADDRESS = process.env.WS_ADDRESS || 'ws://localhost:3000'
const VERSION = process.env.VERSION || 'N/A'

Sentry.init({
  dsn: ERROR_LOGGING
    ? 'https://093af386f1624489a442e1737bf04113@sentry.io/1325311'
    : '',
})

const FORCE_START_DELAY = 10000 // ten seconds
export const MAX_PLAYERS_ALLOWED = 10

const { error, log, warn } = console

log(`Version: ${VERSION}`)

const turnPlayer = (pId, angle) => {
  const player = l1.get(pId)
  // This is needed since events might be sent during score screen when player does not exist
  if (!player) {
    return
  }

  player.turnRate = angle
}

const gameInShapeForNewRound = () => [State.LOBBY, State.SCORE_OVERVIEW]
  .includes(state.state)

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
  playerRepository.find(id).ready = true

  if (playerRepository.getReadyCount() === 1) {
    scheduleForceStartEnablement()
  } else if (playerRepository.allReady()) {
    roundStart()
  }
}

const roundStart = (options = { collectMetrics: false }) => {
  qrCode.hide()

  const { collectMetrics } = options

  if (gameInShapeForNewRound()) {
    state
      .players
      .forEach(({ id }) => {
        playerRepository.find(id)
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
      })
      .then(() => (collectMetrics ? initMetricsBehavior(app) : Promise.resolve()))
  }
}

const createGame = ({ gameCode }) => {
  state.gameCode = gameCode
  transitionToLobby(state.gameCode)
}

const onPlayerData = id => (message) => {
  const { event, payload } = message

  switch (event) {
    case Event.PLAYER_MOVEMENT:
      turnPlayer(id, payload)
      break
    case Event.PLAYER_READY:
      readyPlayer(id)
      break
    case Event.ROUND_START:
      roundStart()
      break
    case Event.PLAYER_DEAD_TAP:
      playerDead(id, payload)
      break
    default:
      warn(`Unhandled event for message: ${message}`)
  }
}

const broadcast = (message) => {
  state
    .players
    .forEach((c) => {
      c.send(
        Channel.RELIABLE,
        message,
      )
    })
}

const morePlayersAllowed = () => playerRepository.count() < MAX_PLAYERS_ALLOWED

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
    id,
    send,
  })

  if (l1.get(Scene.LOBBY)) {
    const numOfPlayers = playerRepository.count()
    createLobbyPlayer(player, numOfPlayers - 1, { newPlayer: true })
  }

  send(Channel.RELIABLE, {
    event:   Event.PLAYER_JOINED,
    payload: {
      id,
      color:   player.color,
      started: state.state === State.PLAYING_ROUND,
    },
  })

  broadcast({
    event:   Event.PLAYER_COUNT,
    payload: playerRepository.count(),
  })

  setOnData(onPlayerData(id))
}

const createNewPlayer = ({ id, send }) => {
  const [color] = state.availableColors
  state.availableColors = state.availableColors.filter(c => c !== color)
  const player = {
    id,
    score: 0,
    color,
    send,
  }

  playerRepository.add(player)
  return player
}

const onPlayerLeave = (id) => {
  log(`[Player Leave] ${id}`)

  const player = playerRepository.find(id)
  state.availableColors = [player.color].concat(state.availableColors)
  playerRepository.remove(id)

  if (state.state === State.LOBBY) {
    l1
      .getByLabel('lobby-player')
      .forEach(l1.destroy)

    state
      .players
      .forEach((p, i) => {
        createLobbyPlayer(p, i, { newPlayer: false })
      })
  }

  broadcast({
    event:   Event.PLAYER_COUNT,
    payload: playerRepository.count(),
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

document.fonts.load('10pt "patchy-robots"')
  .then(() => {
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
  })
  .catch(() => {
    error('Unable to load font')
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

  state
    .eventEmitter
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
    (str, { pixiElapsedMS, displayObjects, l1LoopDuration }) => `${str}\n${displayObjects}, ${pixiElapsedMS}, ${l1LoopDuration}`,
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
  state,
}
