import _ from 'lodash/fp'
import R from 'ramda'
import { Entity, Util, Timer, Sprite, Graphics } from 'l1'
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
import { createTrail, holeGenerator, collisionCheckerWalls, collisionCheckerTrail } from './behavior'

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
  Entity.addChild(
    Entity.getRoot(),
    {
      id: Scene.GAME,
    },
  )

  const playerCountFactor = R.compose(
    Math.sqrt,
    R.length,
    R.values,
  )(gameState.players)

  const playerEntities = R.compose(
    R.zipWith(createPlayer(playerCountFactor), _.shuffle(R.range(0, maxPlayers))),
    _.shuffle,
    Object.values,
  )(gameState.players)

  createWalls()

  bouncePlayers(playerEntities)
    .then(countdown)
    .then(() => {
      playerEntities.forEach((player) => {
        player.behaviors.pivot = pivot(player.id)
        player.behaviors.holeGenerator = holeGenerator(player.speed, SPEED_MULTIPLIER)
        player.behaviors.createTrail = createTrail({
          playerId:        player.id,
          holeGenerator:   player.behaviors.holeGenerator,
          speed:           player.speed,
          speedMultiplier: SPEED_MULTIPLIER,
        })
        player.behaviors.move = move()

        player.behaviors.collisionCheckerTrail =
          collisionCheckerTrail(player.id, SPEED_MULTIPLIER)

        player.behaviors.collisionCheckerWalls =
          collisionCheckerWalls({
            speedMultiplier: SPEED_MULTIPLIER,
            wallThickness:   WALL_THICKNESS,
          })

        const controller = Entity.addChild(player, { id: `${player.id}controller` })
        controller.direction = null

        Entity.destroy(`${player.id}:direction`)
      })
      initPowerups({
        snakeSpeed:      playerEntities[0].speed,
        speedMultiplier: SPEED_MULTIPLIER,
        gameWidth:       GAME_WIDTH,
        gameHeight:      GAME_HEIGHT,
      })
    })
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

const getStartingPosition = Util.grid({
  x:           150,
  y:           150,
  marginX:     200,
  marginY:     300,
  itemsPerRow: 5,
})

const createPlayer = R.curry((playerCountFactor, index, { playerId, spriteId, color }) => {
  const { x, y } = getStartingPosition(index)

  const snakeSpeed = SPEED_MULTIPLIER / playerCountFactor

  const square = Entity.addChild(
    Entity.get(Scene.GAME),
    {
      id:     playerId,
      x,
      y,
      width:  PLAYER_HITBOX_SIZE * (snakeSpeed / SPEED_MULTIPLIER),
      height: PLAYER_HITBOX_SIZE * (snakeSpeed / SPEED_MULTIPLIER),
    },
  )

  square.speed = snakeSpeed
  square.degrees = Util.getRandomInRange(0, 360)
  square.event = new EventEmitter()

  square.event.on(GameEvent.PLAYER_COLLISION, () => {
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

  Entity.addType(square, 'player')

  square.color = color
  square.isAlive = true
  square.spriteId = spriteId

  const directionRadians = toRadians(square.degrees)
  const directionDistanceScale = 100 / playerCountFactor

  const directionIndicator = Entity.addChild(
    Entity.get(playerId),
    {
      id: `${playerId}:direction`,
      x:  (directionDistanceScale * Math.cos(directionRadians)) + (square.width / 2),
      y:  (directionDistanceScale * Math.sin(directionRadians)) + (square.height / 2),
    },
  )

  directionIndicator.spriteId = spriteId
  directionIndicator.color = color

  return square
})

const bouncePlayers = players => new Promise((resolve) => {
  const bouncer = Entity.addChild(Entity.getRoot())
  bouncer.behaviors.bouncePlayers = {
    timer: Timer.create({ duration: Math.floor(TOTAL_BOUNCE_DURATION / players.length) + 15 }),
    index: 0,
    run:   (b) => {
      if (Timer.run(b.timer)) {
        const player = players[b.index]

        const sprite = Sprite.show(
          player,
          {
            texture: `circle-${player.color}`,
            zIndex:  Layer.FOREGROUND,
          },
        )
        sprite.scale.set(player.speed / SPEED_MULTIPLIER / 5)

        // Offset the sprite so that the entity hitbox is in the middle
        sprite.anchor.set((1 - (player.width / sprite.width)) / 2)

        player.behaviors.bounce = bounce(0.02)

        b.index += 1
        Timer.reset(b.timer)

        if (b.index === players.length) {
          Entity.destroy(bouncer)
          resolve()
        }

        const directionIndicator = Entity.get(`${player.id}:direction`)

        const directionSprite = Sprite.show(
          directionIndicator,
          { texture: `arrow-${player.color}` },
        )
        directionSprite.scale.set((1.5 * player.speed) / SPEED_MULTIPLIER)
        directionSprite.anchor.set(0.5)
        directionSprite.rotation = toRadians(player.degrees)
      }
    },
  }
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
  run: (b, e) => {
    if (Entity.get(`${playerId}controller`).direction === SteeringCommand.RIGHT) {
      if (e.degrees >= 360) {
        e.degrees = 0
        return
      }
      e.degrees += TURN_RADIUS
    } else if (Entity.get(`${playerId}controller`).direction === SteeringCommand.LEFT) {
      if (e.degrees < 0) {
        e.degrees = 360
        return
      }
      e.degrees -= TURN_RADIUS
    } else {
      // Do nothing
    }
  },
})

const createWalls = () => {
  const walls = Entity.addChild(Entity.get(Scene.GAME))
  const graphics = Graphics.create(walls)
  graphics.lineStyle(WALL_THICKNESS, GameColor.WHITE, 1)

  graphics.moveTo(0, 0)
  graphics.lineTo(GAME_WIDTH, 0)
  graphics.lineTo(GAME_WIDTH, GAME_HEIGHT)
  graphics.lineTo(0, GAME_HEIGHT)
  graphics.lineTo(0, 0)
}
