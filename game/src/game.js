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

window.debug = {
  ...window.debug,
  transitionToRoundEnd,
}

const { warn } = console

const TURN_RADIUS = 3
const SPEED_MULTIPLIER = 3.6

const WALL_THICKNESS = 6

export const GameEvent = { PLAYER_COLLISION: 'player.collision' }

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
  l1.entity({
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
        R.pipe(
          l1.addBehavior(pivot(player.id)),
          l1.addBehavior(createHoleMaker(player.speed, SPEED_MULTIPLIER)),
          l1.addBehavior(createTrail({
            playerId:        player.id,
            speed:           player.speed,
            speedMultiplier: SPEED_MULTIPLIER,
          })),
          l1.addBehavior(move()),
          l1.addBehavior(collisionCheckerTrail(player.id, SPEED_MULTIPLIER)),
          l1.addBehavior(collisionCheckerWalls({
            speedMultiplier: SPEED_MULTIPLIER,
            wallThickness:   WALL_THICKNESS,
          })),
        )(player)

        const controller = l1.entity({
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

  playTrack(Track.GAME, { loop: true })
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

const createPlayer = R.curry((playerCountFactor, index, { playerId, spriteId, color }) =>
  ({ playerId, spriteId, color }))

const bouncePlayers = (players, playerCountFactor) => new Promise((resolve) => {
  const bouncer = l1.entity()

  const bouncePlayerBehavior = () => ({
    endTime: Math.floor(TOTAL_BOUNCE_DURATION / players.length) + 15,
    data:    {
      index: 0,
    },
    loop:       true,
    onComplete: ({ data }) => {
      const { playerId, spriteId, color } = players[data.index]
      const { x, y } = getStartingPosition(data.index)

      const snakeSpeed = SPEED_MULTIPLIER / playerCountFactor

      const player = l1.sprite({
        id:      playerId,
        x,
        y,
        width:   PLAYER_HITBOX_SIZE * (snakeSpeed / SPEED_MULTIPLIER),
        height:  PLAYER_HITBOX_SIZE * (snakeSpeed / SPEED_MULTIPLIER),
        parent:  l1.get(Scene.GAME),
        types:   ['player'],
        texture: `circle-${color}`,
        zIndex:  Layer.FOREGROUND,
      })

      player.speed = snakeSpeed
      player.degrees = l1.getRandomInRange(0, 360)
      player.event = new EventEmitter()

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

      player.color = color
      player.isAlive = true
      player.spriteId = spriteId
      player.playerId = playerId

      player.asset.scale.set(player.speed / SPEED_MULTIPLIER / 2)

      // Offset the sprite so that the entity hitbox is in the middle
      player.asset.anchor.set((1 - (player.width / player.asset.width)) / 2)

      l1.addBehavior(
        bounce(0.05),
        player,
      )

      data.index += 1

      if (data.index === players.length - 1) {
        l1.destroy(bouncer)
        resolve()
        console.log('resolving!!')
      }

      const directionRadians = toRadians(player.degrees)
      const directionDistanceScale = 100 / playerCountFactor

      const directionIndicator = l1.sprite({
        id:      `${player.playerId}:direction`,
        x:       (directionDistanceScale * Math.cos(directionRadians)) + (player.width / 2),
        y:       (directionDistanceScale * Math.sin(directionRadians)) + (player.height / 2),
        parent:  player,
        texture: `arrow-${player.color}`,
      })

      directionIndicator.spriteId = player.spriteId
      directionIndicator.color = player.color
      directionIndicator.asset.scale.set((1.5 * player.speed) / SPEED_MULTIPLIER)
      directionIndicator.asset.anchor.set(0.5)
      directionIndicator.asset.rotation = toRadians(player.degrees)
    },
  })

  l1.addBehavior(
    bouncePlayerBehavior(),
    bouncer,
  )
})

export const toRadians = angle => angle * (Math.PI / 180)

const move = () => ({
  init: () => {},
  run:  (b, e) => {
    const radians = toRadians(e.degrees)
    e.x += Math.cos(radians) * e.speed
    e.y += Math.sin(radians) * e.speed
  },
})

const pivot = playerId => ({
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
  walls.asset
    .lineStyle(WALL_THICKNESS, GameColor.WHITE, 1)
    .moveTo(0, 0)
    .lineTo(GAME_WIDTH, 0)
    .lineTo(GAME_WIDTH, GAME_HEIGHT)
    .lineTo(0, GAME_HEIGHT)
    .lineTo(0, 0)
}
