import _ from 'lodash/fp'
import R from 'ramda'
import * as l1 from 'l1'
import * as PIXI from 'pixi.js'
import EventEmitter from 'eventemitter3'
import { Event, Channel, SteeringCommand } from 'common'
import { GAME_WIDTH, GAME_HEIGHT } from './rendering'
import gameState, { CurrentState } from './gameState'
import { transitionToRoundEnd } from './roundEnd'
import Layer from './util/layer'
import countdown from './countdown'
import bounce from './bounce'
import Scene from './Scene'
import addPoints from './addPoints'
import { initPowerups } from './powerup'
import { Track, playTrack } from './music'
import { createTrail, createHoleMaker, collisionCheckerWalls, collisionCheckerTrail } from './behavior'
import GameEvent from './util/gameEvent'
import { initEmptyTree } from './kd-tree'

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
  BLUE:  '0x04A4EC',
  WHITE: '0xeeeeee',
}

export const transitionToGameScene = (maxPlayers) => {
  gameState.currentState = CurrentState.PLAYING_ROUND
  gameState.kdTree = initEmptyTree()

  const gameScene = new PIXI.Container()
  l1.add(gameScene, {
    id: Scene.GAME,
  })

  const playerCountFactor = R.compose(
    Math.sqrt,
    R.length,
    R.values,
  )(gameState.players)

  const players = R.compose(
    R.zipWith(createPlayer(playerCountFactor), _.shuffle(R.range(0, maxPlayers))),
    _.shuffle,
    Object.values,
  )(gameState.players)

  createWalls()

  bouncePlayers(players, playerCountFactor)
    .then(countdown)
    .then(() => {
      players.forEach((player) => {
        const behaviorsToAdd = [
          pivot(player),
          createHoleMaker(player, player.speed, SPEED_MULTIPLIER),
          createTrail({
            player,
            speed:           player.speed,
            speedMultiplier: SPEED_MULTIPLIER,
          }),
          move(player),
          collisionCheckerTrail(player, SPEED_MULTIPLIER),
          collisionCheckerWalls({
            player,
            speedMultiplier: SPEED_MULTIPLIER,
            wallThickness:   WALL_THICKNESS,
          }),
        ]

        R.forEach(
          l1.addBehavior,
          behaviorsToAdd,
        )

        l1.destroy(`${player.playerId}:direction`)
      })
      initPowerups({
        snakeSpeed:      l1.getByLabel('player')[0].speed,
        speedMultiplier: SPEED_MULTIPLIER,
        gameWidth:       GAME_WIDTH,
        gameHeight:      GAME_HEIGHT,
      })
    })

  playTrack(Track.GAME, { loop: true, id: 'gameMusic' })
}

export const getPlayersWithHighestScore = players =>
  R.compose(
    score => Object
      .values(players)
      .filter(p => p.score === score),
    R.reduce(R.max, 0),
    R.map(parseInt),
    Object.keys,
    R.groupBy(R.prop('score')),
    Object.values,
  )(players)

export const scoreToWin = players => (Object.keys(players).length - 1) * 4

export const resetPlayerScore = (acc, player) => {
  acc[player.playerId] = { ...player, score: 0 }
  return acc
}

export const resetPlayersScore = players => R.compose(
  R.reduce(resetPlayerScore, {}),
  Object.values,
)(players)

export const calculatePlayerScores = ({ lastRoundResult: { playerFinishOrder } }) =>
  R.zip(R.range(0, playerFinishOrder.length), playerFinishOrder)

export const applyPlayerScores = (players, scores) => {
  const scoreDict = scores
    .map(([score, playerId]) => ({ [playerId]: score }))
    .reduce((dict, score) => ({ ...dict, ...score }), {})

  return Object
    .keys(players)
    .map((playerId) => {
      const player = players[playerId]

      return {
        ...player,
        score:         player.score + (scoreDict[playerId] || 0),
        previousScore: player.score,
      }
    })
    .reduce((updatedPlayers, player) => (
      {
        ...updatedPlayers,
        ...{
          [player.playerId]: player,
        },
      }
    ), {})
}

const getStartingPosition = l1.grid({
  x:           150,
  y:           150,
  marginX:     200,
  marginY:     300,
  itemsPerRow: 5,
})

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
  player.degrees = l1.getRandomInRange(0, 360)
  player.event = new EventEmitter()
  player.color = color
  player.isAlive = true
  player.spriteId = spriteId
  player.playerId = playerId

  player.event.on(GameEvent.PLAYER_COLLISION, () => {
    const controller = gameState
      .controllers[playerId]

    if (!controller) {
      warn(`controller with id: ${playerId} not found`)
      return
    }

    controller
      .send(Channel.RELIABLE, {
        event:   Event.PLAYER_DIED,
        payload: {},
      })
  })

  player.scale.set(player.speed / SPEED_MULTIPLIER / 2)

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
      directionIndicator.scale.set((3 * player.speed) / SPEED_MULTIPLIER)
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
    },
  )
  const halfWallThickness = WALL_THICKNESS / 2

  walls
    .lineStyle(WALL_THICKNESS, GameColor.WHITE, 1)
    .moveTo(halfWallThickness, halfWallThickness)
    .lineTo(GAME_WIDTH - halfWallThickness, halfWallThickness)
    .lineTo(GAME_WIDTH - halfWallThickness, GAME_HEIGHT - halfWallThickness)
    .lineTo(halfWallThickness, GAME_HEIGHT - halfWallThickness)
    .lineTo(halfWallThickness, halfWallThickness)

  walls.cacheAsBitmap = true
}
