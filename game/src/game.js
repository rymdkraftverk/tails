import _ from 'lodash/fp'
import R from 'ramda'
import l1 from 'l1'
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
  l1.container({
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
          pivot(player.id),
          createHoleMaker(player.speed, SPEED_MULTIPLIER),
          createTrail({
            playerId:        player.id,
            speed:           player.speed,
            speedMultiplier: SPEED_MULTIPLIER,
          }),
          move(),
          collisionCheckerTrail(player.id, SPEED_MULTIPLIER),
          collisionCheckerWalls({
            speedMultiplier: SPEED_MULTIPLIER,
            wallThickness:   WALL_THICKNESS,
          }),
        ]

        R.forEach(
          l1.addBehavior(player),
          behaviorsToAdd,
        )

        const controller = l1.container({
          id:     `${player.id}controller`,
          parent: player,
        })
        controller.direction = null

        l1.destroy(`${player.id}:direction`)
      })
      initPowerups({
        snakeSpeed:      l1.getByType('player')[0].speed,
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

  const player = l1.sprite({
    id:      playerId,
    parent:  l1.get(Scene.GAME),
    types:   ['player'],
    texture: `circle-${color}`,
    zIndex:  Layer.FOREGROUND,
  })

  player.asset.x = x
  player.asset.y = y
  player.asset.visible = false

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
        event:   Event.Rtc.PLAYER_DIED,
        payload: {},
      })
  })

  player.asset.scale.set(player.speed / SPEED_MULTIPLIER / 2)

  const playerSize = PLAYER_HITBOX_SIZE * (snakeSpeed / SPEED_MULTIPLIER)

  player.asset.hitArea = new l1.PIXI.Rectangle(
    0,
    0,
    playerSize,
    playerSize,
  )
  // Offset the sprite so that the entity hitbox is in the middle
  player.asset.anchor.set((1 - (playerSize / player.asset.width)) / 2)

  return player
})

const bouncePlayers = (players, playerCountFactor) => new Promise((resolve) => {
  const bouncer = l1.container()

  const bouncePlayerBehavior = () => ({
    endTime: Math.floor(TOTAL_BOUNCE_DURATION / players.length) + 15,
    data:    {
      index: 0,
    },
    loop:       true,
    onComplete: ({ data }) => {
      const player = players[data.index]
      player.asset.visible = true

      l1.addBehavior(
        player,
        bounce(0.05),
      )

      data.index += 1

      const directionRadians = toRadians(player.degrees)
      const directionDistanceScale = 200 / playerCountFactor

      const directionIndicator = l1.sprite({
        id:      `${player.playerId}:direction`,
        parent:  player,
        texture: `arrow-${player.color}`,
      })

      directionIndicator.spriteId = player.spriteId
      directionIndicator.color = player.color

      directionIndicator.asset.x =
        (directionDistanceScale * Math.cos(directionRadians)) + (player.asset.width * 2)
      directionIndicator.asset.y =
        (directionDistanceScale * Math.sin(directionRadians)) + (player.asset.height * 2)
      directionIndicator.asset.scale.set((3 * player.speed) / SPEED_MULTIPLIER)
      directionIndicator.asset.anchor.set(0.5)
      directionIndicator.asset.rotation = toRadians(player.degrees)

      if (data.index === players.length) {
        l1.destroy(bouncer)
        resolve()
      }
    },
  })

  l1.addBehavior(
    bouncer,
    bouncePlayerBehavior(),
  )
})

export const toRadians = angle => angle * (Math.PI / 180)

const move = () => ({
  id:       'move',
  onUpdate: ({ entity }) => {
    const radians = toRadians(entity.degrees)
    entity.asset.x += Math.cos(radians) * entity.speed
    entity.asset.y += Math.sin(radians) * entity.speed
  },
})

const pivot = playerId => ({
  id:       'pivot',
  onUpdate: ({ entity }) => {
    if (l1.get(`${playerId}controller`).direction === SteeringCommand.RIGHT) {
      if (entity.degrees >= 360) {
        entity.degrees = 0
        return
      }
      entity.degrees += TURN_RADIUS
    } else if (l1.get(`${playerId}controller`).direction === SteeringCommand.LEFT) {
      if (entity.degrees < 0) {
        entity.degrees = 360
        return
      }
      entity.degrees -= TURN_RADIUS
    } else {
      // Do nothing
    }
  },
})

const createWalls = () => {
  const walls = l1.graphics({
    parent: l1.get(Scene.GAME),
  })

  const halfWallThickness = WALL_THICKNESS / 2

  walls.asset
    .lineStyle(WALL_THICKNESS, GameColor.WHITE, 1)
    .moveTo(halfWallThickness, halfWallThickness)
    .lineTo(GAME_WIDTH - halfWallThickness, halfWallThickness)
    .lineTo(GAME_WIDTH - halfWallThickness, GAME_HEIGHT - halfWallThickness)
    .lineTo(halfWallThickness, GAME_HEIGHT - halfWallThickness)
    .lineTo(halfWallThickness, halfWallThickness)

  /* cacheAsBitmap will crash if the empty filters array is not removed first */
  walls.asset.filters = null
  walls.asset.cacheAsBitmap = true
}
