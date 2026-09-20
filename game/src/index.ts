import * as l2 from 'l2'
import * as PIXI from 'pixi.js'
import { Event, Channel } from 'common'
import * as Sentry from '@sentry/browser'
import { type Initiator } from 'rkv-signaling'
import { host, hideQrCode } from 'rkv-signaling/game'
import { transitionToGameScene } from './game'
import { transitionToLobby, createLobbyPlayer } from './lobby'
import Scene from './Scene'
import Layer from './constant/layer'
import fullscreenFadeInOut from './fullscreenFadeInOut'
import { State, state } from './state'
import playerRepository from './repository/player'
import { GAME_WIDTH, GAME_HEIGHT } from './constant/rendering'
import GameEvent from './constant/gameEvent'
import playerDead from './playerDead'

const WS_ADDRESS = process.env.WS_ADDRESS || 'ws://localhost:3000'
const HTTP_ADDRESS = process.env.HTTP_ADDRESS || 'http://localhost:3000'
const VERSION = process.env.VERSION || 'N/A'

Sentry.init({ dsn: process.env.SENTRY_DSN })

const FORCE_START_DELAY = 10000 // ten seconds
export const MAX_PLAYERS_ALLOWED = 10

const { error, log, warn } = console

log(`Version: ${VERSION}`)

const turnPlayer = (pId: string, angle: number) => {
  const player = l2.get(pId)
  // This is needed since events might be sent during score screen when player does not exist
  if (!player) {
    return
  }

  player.turnRate = angle
}

const gameInShapeForNewRound = () => (
  state.state === State.LOBBY || state.state === State.SCORE_OVERVIEW
)

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

const readyPlayer = (id: string) => {
  playerRepository.find(id).ready = true

  if (playerRepository.allReady() && playerRepository.count() > 1) {
    roundStart()
  } else if (playerRepository.getReadyCount() === 1) {
    scheduleForceStartEnablement()
  }
}

const roundStart = (options = { collectMetrics: false }) => {
  hideQrCode()

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
        l2
          .getAll()
          .filter(e => !entitiesToKeep.some(id => id === l2.getId(e)))
          .forEach((displayObject) => {
            if (!l2.isDestroyed(displayObject)) {
              l2.destroy(displayObject)
            }
          })

        transitionToGameScene(MAX_PLAYERS_ALLOWED)
      })
      .then(() => (collectMetrics ? initMetricsBehavior(l2.getApp()) : Promise.resolve()))
  }
}

const createGame = ({ gameCode }: { gameCode: string }) => {
  state.gameCode = gameCode
  transitionToLobby(state.gameCode)
}

const onPlayerData = (id: string) => (message: { event: string, payload: never }) => {
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

const broadcast = (message: { event: string, payload?: unknown }) => {
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

export const join = ({
  id,
  setOnData,
  send,
  close,
}: Initiator, bot?: BotKind) => {
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
    bot,
  })

  if (l2.get(Scene.LOBBY)) {
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

const onPlayerJoin = (initiator: Initiator) => join(initiator)

const createNewPlayer = ({
  id, send, bot,
}: Pick<Initiator, 'id' | 'send'> & { bot?: BotKind }) => {
  const [color] = state.availableColors
  state.availableColors = state.availableColors.filter(c => c !== color)
  const player = {
    id,
    score: 0,
    color,
    send,
    bot,
  }

  playerRepository.add(player)
  return player
}

export const onPlayerLeave = (id: string) => {
  log(`[Player Leave] ${id}`)
  if (!playerRepository.has(id)) return

  const player = playerRepository.find(id)
  state.availableColors = [player.color].concat(state.availableColors)
  playerRepository.remove(id)

  if (state.state === State.LOBBY) {
    l2
      .getByLabel('lobby-player')
      .forEach(displayObject => l2.destroy(displayObject))

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

const boot = async () => {
  const gameElement = document.getElementById('game')

  if (!gameElement) {
    throw new Error('Found no #game element to mount the canvas into')
  }

  await l2.boot({
    mount:             gameElement,
    width:             GAME_WIDTH,
    height:            GAME_HEIGHT,
    antialias:         true,
    clearBeforeRender: false,
    logging:           false,
    onError:           (e: Error) => {
      Sentry.captureException(e)
    },
  })

  await document.fonts.load('10pt "patchy-robots"')
    .catch(() => {
      error('Unable to load font')
    })

  l2.useSpritesheets([await PIXI.Assets.load('assets/spritesheet.json')])

  const background = new PIXI.Sprite(l2.getTexture('background'))

  background.scale.set(10)

  l2.add(background, {
    id:     'background',
    zIndex: Layer.ABSOLUTE_BACKGROUND,
  })

  host({
    httpAddress:      HTTP_ADDRESS,
    wsAddress:        WS_ADDRESS,
    onInitiatorJoin:  onPlayerJoin,
    onInitiatorLeave: onPlayerLeave,
  })
    .then((gameCode) => {
      createGame({ gameCode })
      log(`[Game created] ${gameCode}`)
    })

  l2.fitToWindow()
}

const printBehaviors = () => {
  log('BEHAVIORS:')
  l2.getAllBehaviors()
    .forEach((b) => {
      log(b.id)
    })
  log('==============')
}

const start = () => {
  l2.getApp().ticker.start()
}

const stop = () => {
  l2.getApp().ticker.stop()
}

const initMetricsBehavior = (appReference: PIXI.Application) => {
  const metrics: Metric[] = []

  l2.addBehavior({
    onUpdate: () => {
      metrics.push({
        pixiElapsedMS:  appReference.ticker.elapsedMS,
        displayObjects: l2.getAll().length,
        l1LoopDuration: l2.getLoopDuration(),
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

type Metric = {
  displayObjects: number
  l1LoopDuration: number
  pixiElapsedMS:  number
}

const average = (measurements: Metric[]): Metric => ({
  displayObjects: measurements[0].displayObjects,
  l1LoopDuration: measurements.reduce((a, m) => a + m.l1LoopDuration, 0) / measurements.length,
  pixiElapsedMS:  measurements.reduce((a, m) => a + m.pixiElapsedMS, 0) / measurements.length,
})

const formatMetricsCSV = (metrics: Metric[]) => {
  const byDisplayObjects = new Map<number, Metric[]>()

  metrics.forEach((metric) => {
    byDisplayObjects.set(
      metric.displayObjects,
      (byDisplayObjects.get(metric.displayObjects) ?? []).concat(metric),
    )
  })

  return Array
    .from(byDisplayObjects.values())
    .map(average)
    .reduce(
      (str, { pixiElapsedMS, displayObjects, l1LoopDuration }) => (
        `${str}\n${displayObjects}, ${pixiElapsedMS}, ${l1LoopDuration}`
      ),
      'DisplayObjects, PixiElapsedMS, L1LoopDuration',
    )
}

window.debug = {
  ...window.debug,
  roundStart,
  roundStartMetrics: () => roundStart({ collectMetrics: true }),
  printBehaviors,
  scenes:            () => Object
    .values(Scene)
    .filter(scene => l2.get(scene)),
  start,
  stop,
  state,
}

boot()
