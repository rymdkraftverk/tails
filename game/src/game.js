import _ from 'lodash/fp'
import R from 'ramda'
import * as l1 from 'l1'
import * as PIXI from 'pixi.js'
import EventEmitter from 'eventemitter3'
import { Event, Channel, SteeringCommand } from 'common'
import { GAME_WIDTH, GAME_HEIGHT } from './rendering'
import gameState, { CurrentState, getPlayer } from './gameState'
import { transitionToRoundEnd } from './roundEnd'
import Layer from './constant/layer'
import countdown from './countdown'
import bounce from './bounce'
import Scene from './Scene'
import addPoints from './addPoints'
import { initPowerups } from './powerup'
import { Track, playTrack } from './music'
import { createTrail, createHoleMaker, collisionCheckerWalls, collisionCheckerTrail } from './behavior'
import GameEvent from './constant/gameEvent'
import { initEmptyTree } from './kd-tree'
import createHeader, { HEADER_HEIGHT } from './header'
import getControllerUrl from './getControllerUrl'

window.debug = {
  ...window.debug,
  transitionToRoundEnd,
}

const { warn } = console

const TURN_RADIUS = 3
const SPEED_MULTIPLIER = 3.6

const WALL_THICKNESS = 3

const PLAYER_HITBOX_SIZE = 14

const TOTAL_BOUNCE_DURATION = 50

gameState
  .events
  .on(GameEvent.PLAYER_COLLISION, addPoints)

export const GameColor = {
  BLUE:  '0x0B4D6C',
  WHITE: '0xeeeeee',
}

export const transitionToGameScene = (maxPlayers) => {
  gameState.currentState = CurrentState.PLAYING_ROUND
  gameState.kdTree = initEmptyTree()

  // The header is persistent across game and score
  createHeader({
    url:  getControllerUrl(),
    code: gameState.gameCode,
  })

  const gameScene = new PIXI.Container()
  l1.add(gameScene, {
    id: Scene.GAME,
  })

  const playerCountFactor = R.compose(
    Math.sqrt,
    R.length,
  )(gameState.players)

  const players = R.compose(
    R.zipWith(createPlayer(playerCountFactor), _.shuffle(R.range(0, maxPlayers))),
    _.shuffle,
  )(gameState.players)

  createWalls()

  bouncePlayers(players, playerCountFactor)
    .then(countdown)
    .then(() => {
      players.forEach((player) => {
        const behaviorsToAdd = [
          pivot(player),
          createHoleMaker(player, player.scaleFactor, SPEED_MULTIPLIER),
          createTrail({
            player,
            scale:           player.scaleFactor,
            speedMultiplier: SPEED_MULTIPLIER,
          }),
          move(player),
          collisionCheckerTrail(player, SPEED_MULTIPLIER),
          collisionCheckerWalls({
            player,
            speedMultiplier: SPEED_MULTIPLIER,
            wallThickness:   WALL_THICKNESS,
          }),
          player.playerId.startsWith('debugSpiralPlayer') ? performanceTestCurl(player) : null,
        ]

        R.forEach(
          l1.addBehavior,
          R.reject(R.isNil, behaviorsToAdd),
        )

        l1.destroy(`${player.playerId}:direction`)
      })
      initPowerups({
        snakeSpeed:      l1.getByLabel('player')[0].speed,
        speedMultiplier: SPEED_MULTIPLIER,
        gameWidth:       GAME_WIDTH,
        gameHeight:      GAME_HEIGHT + HEADER_HEIGHT,
      })
    })

  playTrack(Track.GAME, { loop: true, id: 'gameMusic' })
}

export const getPlayersWithHighestScore = players =>
  R.compose(
    score => players
      .filter(p => p.score === score),
    R.reduce(R.max, 0),
    R.map(parseInt),
    Object.keys,
    R.groupBy(R.prop('score')),
  )(players)

export const scoreToWin = players => (Object.keys(players).length - 1) * 4

export const resetPlayersScore = R.map(x => ({ ...x, score: 0 }))

export const calculatePlayerScores = ({ lastRoundResult: { playerFinishOrder } }) =>
  R.zip(R.range(0, playerFinishOrder.length), playerFinishOrder)

export const applyPlayerScores = (players, scores) => {
  const scoreDict = scores
    .map(([score, playerId]) => ({ [playerId]: score }))
    .reduce((dict, score) => ({ ...dict, ...score }), {})

  return players
    .map(player => ({
      ...player,
      score:         player.score + (scoreDict[player.playerId] || 0),
      previousScore: player.score,
    }))
}

const getStartingPosition = (index) => {
  const maxYRadius = (GAME_HEIGHT - HEADER_HEIGHT) / 2 / (1 + Math.sqrt(3))
  const maxXRadius = GAME_WIDTH / 8

  const topRow = R
    .range(1, 4)
    .map(i => ({
      x: i * 2 * maxXRadius,
      y: maxYRadius,
    }))

  const middleRow = R
    .range(0, 4)
    .map(i => ({
      x: maxXRadius * (1 + (2 * i)),
      y: maxYRadius * (1 + Math.sqrt(3)),
    }))

  const bottomRow = R
    .range(1, 4)
    .map(i => ({
      x: i * 2 * maxXRadius,
      y: maxYRadius * (1 + (2 * Math.sqrt(3))),
    }))

  const positions = bottomRow
    .concat(middleRow)
    .concat(topRow)

  return positions[index]
}

const createPlayer = R.curry((playerCountFactor, index, { playerId, spriteId, color }) => {
  const { x, y } = getStartingPosition(index)

  const snakeSpeed = SPEED_MULTIPLIER / playerCountFactor

  const player = new PIXI.Sprite(l1.getTexture(`circle-${color}`))
  l1.add(
    player,
    {
      id:     playerId,
      parent: l1.get(Scene.GAME),
      labels: ['player'],
      zIndex: Layer.FOREGROUND,
    },
  )

  player.x = x
  player.y = y
  player.visible = false

  player.speed = snakeSpeed
  player.scaleFactor = snakeSpeed
  player.degrees = l1.getRandomInRange(0, 360)
  player.event = new EventEmitter()
  player.color = color
  player.isAlive = true
  player.spriteId = spriteId
  player.playerId = playerId
  player.preventTrail = 0

  player.event.on(GameEvent.PLAYER_COLLISION, () => {
    const p = getPlayer(playerId)

    if (!p) {
      warn(`Player with id: ${playerId} not found`)
      return
    }

    p.send(Channel.RELIABLE, {
      event:   Event.PLAYER_DIED,
      payload: {},
    })
  })

  player.scale.set(player.scaleFactor / SPEED_MULTIPLIER / 2)

  const playerSize = PLAYER_HITBOX_SIZE * (snakeSpeed / SPEED_MULTIPLIER)

  player.hitArea = new PIXI.Rectangle(
    0,
    0,
    playerSize,
    playerSize,
  )
  // Offset the sprite so that the player hitbox is in the middle
  player.anchor.set((1 - (playerSize / player.width)) / 2)

  return player
})

const bouncePlayers = (players, playerCountFactor) => new Promise((resolve) => {
  const bouncer = new PIXI.Container()
  l1.add(bouncer, {
    id: 'bouncer',
  })

  const bouncePlayerBehavior = () => ({
    id:       'bouncePlayers',
    duration: Math.floor(TOTAL_BOUNCE_DURATION / players.length) + 15,
    data:     {
      index: 0,
    },
    loop:       true,
    onComplete: ({ data }) => {
      const player = players[data.index]
      player.visible = true

      l1.addBehavior(bounce(player, 0.05))

      data.index += 1

      const directionRadians = toRadians(player.degrees)
      const directionDistanceScale = 200 / playerCountFactor

      const directionIndicator = new PIXI.Sprite(l1.getTexture(`arrow-${player.color}`))
      l1.add(
        directionIndicator,
        {
          id:     `${player.playerId}:direction`,
          parent: player,
        },
      )

      directionIndicator.spriteId = player.spriteId
      directionIndicator.color = player.color

      directionIndicator.x =
        (directionDistanceScale * Math.cos(directionRadians)) + (player.width * 2)
      directionIndicator.y =
        (directionDistanceScale * Math.sin(directionRadians)) + (player.height * 2)
      directionIndicator.scale.set((3 * player.scaleFactor) / SPEED_MULTIPLIER)
      directionIndicator.anchor.set(0.5)
      directionIndicator.rotation = toRadians(player.degrees)

      if (data.index === players.length) {
        l1.destroy(bouncer)
        l1.removeBehavior('bouncePlayers')
        resolve()
      }
    },
  })

  l1.addBehavior(bouncePlayerBehavior())
})

export const toRadians = angle => angle * (Math.PI / 180)

const move = player => ({
  id:       `move-${player.playerId}`,
  onUpdate: () => {
    const radians = toRadians(player.degrees)
    player.x += Math.cos(radians) * player.speed
    player.y += Math.sin(radians) * player.speed
  },
})

const performanceTestCurl = player => ({
  onUpdate: ({ counter }) => {
    // inverse relationship with square root is chosen with mathematical precision.
    // factor 12.3 is chosen by trial and error.
    // + 1 is to avoid divide by zero
    const factor = 12.3 / Math.sqrt(counter + 1)
    player.degrees += (TURN_RADIUS * factor)
  },
})

const pivot = player => ({
  id:       `pivot-${player.playerId}`,
  onUpdate: () => {
    if (player.direction === SteeringCommand.RIGHT) {
      if (player.degrees >= 360) {
        player.degrees = 0
        return
      }
      player.degrees += TURN_RADIUS
    } else if (player.direction === SteeringCommand.LEFT) {
      if (player.degrees < 0) {
        player.degrees = 360
        return
      }
      player.degrees -= TURN_RADIUS
    } else {
      // Do nothing
    }
  },
})

const createWalls = () => {
  const walls = new PIXI.Graphics()
  l1.add(
    walls,
    {
      id:     'walls',
      parent: l1.get(Scene.GAME),
      zIndex: Layer.FOREGROUND + 1,
    },
  )
  const halfWallThickness = WALL_THICKNESS / 2

  const y = HEADER_HEIGHT + halfWallThickness

  walls
    .lineStyle(WALL_THICKNESS, GameColor.WHITE, 1)
    .moveTo(halfWallThickness, y)
    .lineTo(GAME_WIDTH - halfWallThickness, y)
    .lineTo(GAME_WIDTH - halfWallThickness, GAME_HEIGHT)
    .lineTo(halfWallThickness, GAME_HEIGHT)
    .lineTo(halfWallThickness, y)

  walls.cacheAsBitmap = true
}
