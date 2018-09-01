import _ from 'lodash/fp'
import R from 'ramda'
import { Entity, Util, Timer, Sound, Sprite, Particles, Graphics } from 'l1'
import EventEmitter from 'eventemitter3'
import { Event, Channel, SteeringCommand } from 'common'
import { GAME_WIDTH, GAME_HEIGHT } from './rendering'
import gameState from './gameState'
import explode from './particleEmitter/explode'
import { transitionToRoundEnd } from './roundEnd'
import layers from './util/layers'
import countdown from './countdown'
import bounce from './bounce'
import Scene from './Scene'
import addPoints from './addPoints'

window.debug = {
  ...window.debug,
  transitionToRoundEnd,
}

const { warn } = console

const TURN_RADIUS = 3
const SPEED_MULTIPLIER = 3.6

const GENERATE_HOLE_MAX_TIME = 300
const GENERATE_HOLE_MIN_TIME = 60

const HOLE_LENGTH_MAX_TIME = 30
const HOLE_LENGTH_MIN_TIME = 10

const WALL_THICKNESS = 6

export const GameEvent = { PLAYER_COLLISION: 'player.collision' }

const PLAYER_HITBOX_SIZE = 14
const TRAIL_HITBOX_SIZE = 24

const TOTAL_BOUNCE_DURATION = 50

gameState
  .events
  .on(GameEvent.PLAYER_COLLISION, addPoints)

const GHOST_POWERUP_DURATION = 500

export const GameColor = {
  BLUE:  '0x04A4EC',
  WHITE: '0xeeeeee',
}

export const transitionToGameScene = (maxPlayers) => {
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
        player.behaviors.holeGenerator = holeGenerator(player.speed)
        player.behaviors.createTrail = createTrail(
          player.id,
          player.spriteId,
          player.behaviors.holeGenerator,
          player.speed,
        )
        player.behaviors.move = move()
        player.behaviors.collisionCheckerTrail = collisionCheckerTrail(player.id, playerCountFactor)
        player.behaviors.collisionCheckerWalls = collisionCheckerWalls()

        const controller = Entity.addChild(player, { id: `${player.id}controller` })
        controller.direction = null

        Entity.destroy(`${player.id}:direction`)
      })
      initPowerups(playerCountFactor, playerEntities[0].speed)
    })
}

const initPowerups = (playerCountFactor, snakeSpeed) => {
  const powerupGenerator = Entity.addChild(Entity.get(Scene.GAME))
  const getNewPowerupTimer = () => Timer.create({ duration: Util.getRandomInRange(120, 240) })
  powerupGenerator.behaviors.generatePowerups = {
    init: (b) => {
      b.timer = getNewPowerupTimer()
    },
    run: (b) => {
      if (Timer.run(b.timer)) {
        const powerup = Entity.addChild(powerupGenerator, {
          x:      Util.getRandomInRange(100, GAME_WIDTH - 100),
          y:      Util.getRandomInRange(100, GAME_HEIGHT - 100),
          width:  64 * (snakeSpeed / SPEED_MULTIPLIER),
          height: 64 * (snakeSpeed / SPEED_MULTIPLIER),
        })
        const sprite = Sprite.show(powerup, {
          texture: 'powerup-ghost',
        })
        sprite.scale.set((snakeSpeed / SPEED_MULTIPLIER))

        powerup.behaviors.collisionChecker = {
          run: () => {
            const collidingEntity = Entity
              .getByType('player')
              .find(e => Entity.isColliding(e, powerup))
            if (collidingEntity) {
              const soundEntity = Entity.addChild(collidingEntity)
              Sound.play(soundEntity, { src: './sounds/join1.wav', volume: 0.6 })
              Entity.destroy(powerup)
              b.timer = getNewPowerupTimer()

              collidingEntity.behaviors.ghost = {
                timer: Timer.create({ duration: GHOST_POWERUP_DURATION }),
                init:  (be, e) => {
                  // Scale up player 3 times
                  e.asset.scale.set((e.speed / SPEED_MULTIPLIER / 2) * 3)
                  e.asset.alpha = 0.4
                  /* eslint-disable fp/no-delete */
                  delete e.behaviors.holeGenerator
                  delete e.behaviors.createTrail
                  delete e.behaviors.collisionCheckerTrail
                  /* eslint-enable fp/no-delete */
                },
                run: (be, e) => {
                  if (Timer.run(be.timer) && !e.killed) {
                    // Reset player
                    e.asset.scale.set((e.speed / SPEED_MULTIPLIER / 2))
                    e.asset.alpha = 1
                    e.behaviors.collisionCheckerTrail =
                      collisionCheckerTrail(e.id, playerCountFactor)
                    e.behaviors.holeGenerator = holeGenerator(e.speed)
                    e.behaviors.createTrail = createTrail(
                      e.id,
                      e.spriteId,
                      e.behaviors.holeGenerator,
                      e.speed,
                    )
                  }
                },
              }
            }
          },
        }
      }
    },
  }
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

export const scoreToWin = players => (Object.keys(players).length - 1) * 5

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
            zIndex:  layers.FOREGROUND,
          },
        )
        sprite.scale.set(player.speed / SPEED_MULTIPLIER / 2)

        // Offset the sprite so that the entity hitbox is in the middle
        sprite.anchor.set((1 - (player.width / sprite.width)) / 2)

        player.behaviors.bounce = bounce()

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

const createTrail = (playerId, spriteId, holeGenerator, speed) => ({
  timer: Timer.create({ duration: Math.ceil(2) }),
  run:   (b, e) => {
    if (holeGenerator.preventTrail) {
      return
    }
    const width = TRAIL_HITBOX_SIZE * (speed / SPEED_MULTIPLIER)
    const height = TRAIL_HITBOX_SIZE * (speed / SPEED_MULTIPLIER)

    // Find the middle of the player entity so that
    // we can put the trails' middle point in the same spot
    const middleX = Entity.getX(e) + (e.width / 2)
    const middleY = Entity.getY(e) + (e.height / 2)

    if (Timer.run(b.timer)) {
      const trailE = Entity.addChild(
        Entity.get(Scene.GAME),
        {
          x: middleX - (width / 2),
          y: middleY - (height / 2),
          width,
          height,
        },
      )
      trailE.active = false
      trailE.player = playerId
      Entity.addType(trailE, 'trail')
      const sprite = Sprite.show(
        trailE,
        { texture: `circle-${e.color}` },
      )
      sprite.scale.set(speed / SPEED_MULTIPLIER / 2)
      Timer.reset(b.timer)

      trailE.behaviors.activate = activate()
    }
  },
})

const holeGenerator = speed => ({
  preventTrail:      false,
  generateHoleTimer: Timer
    .create({
      duration: Util.getRandomInRange(
        GENERATE_HOLE_MIN_TIME,
        GENERATE_HOLE_MAX_TIME,
      ),
    }),
  holeLengthTimer: null,
  run:             (b) => {
    if (b.generateHoleTimer && Timer.run(b.generateHoleTimer)) {
      b.preventTrail = true

      const rand = Util.getRandomInRange(
        Math.ceil(HOLE_LENGTH_MIN_TIME * (SPEED_MULTIPLIER / speed)),
        Math.ceil(HOLE_LENGTH_MAX_TIME * (SPEED_MULTIPLIER / speed)),
      )
      b.holeLengthTimer = Timer.create({ duration: rand })

      b.generateHoleTimer = null
    } else if (b.holeLengthTimer && Timer.run(b.holeLengthTimer)) {
      b.preventTrail = false

      const rand = Util.getRandomInRange(
        GENERATE_HOLE_MIN_TIME,
        GENERATE_HOLE_MAX_TIME,
      )
      b.generateHoleTimer = Timer.create({ duration: rand })

      b.holeLengthTimer = null
    }
  },
})

/*
 * This behavior is needed so that the player wont immediately collide with its own tail.
 */
const activate = () => ({
  timer: Timer.create({ duration: 15 }),
  run:   (b, e) => {
    if (Timer.run(b.timer)) {
      e.active = true
    }
  },
})

const killPlayer = (e) => {
  const particles = Entity.addChild(e)
  Particles.emit(particles, {
    ...explode({
      degrees:     e.degrees,
      scaleFactor: SPEED_MULTIPLIER / e.speed,
      radius:      e.width,
      x:           Entity.getX(e),
      y:           Entity.getY(e),
    }),
    zIndex: layers.FOREGROUND,
  })

  const sound = Entity.addChild(e)

  Sound.play(sound, { src: './sounds/explosion.wav', volume: 0.6 })

  e.killed = true
  /* eslint-disable fp/no-delete */
  delete e.behaviors.collisionCheckerTrail
  delete e.behaviors.collisionCheckerWalls
  delete e.behaviors.holeGenerator
  delete e.behaviors.createTrail
  delete e.behaviors.move
  delete e.behaviors.pivot
  /* eslint-enable fp/no-delete */

  gameState.events.emit(GameEvent.PLAYER_COLLISION, e.color)
  e.event.emit(GameEvent.PLAYER_COLLISION)
}

const collisionCheckerTrail = playerId => ({
  timer: Timer.create({ duration: 2 }),
  run:   (b, e) => {
    if (Timer.run(b.timer)) {
      const allTrails = Entity
        .getByType('trail')
        .filter(t => t.active || t.player !== playerId)

      if (allTrails.some(t => Entity.isColliding(t, e))) {
        killPlayer(e)
        checkPlayersAlive()
      }

      Timer.reset(b.timer)
    }
  },
})

const collisionCheckerWalls = () => ({
  timer: Timer.create({ duration: 2 }),
  run:   (b, e) => {
    if (
      Entity.getX(e) < WALL_THICKNESS ||
      Entity.getX(e) > GAME_WIDTH - WALL_THICKNESS - e.width ||
      Entity.getY(e) < WALL_THICKNESS ||
      Entity.getY(e) > GAME_HEIGHT - WALL_THICKNESS - e.height) {
      killPlayer(e)
      checkPlayersAlive()
    }
  },
})

const checkPlayersAlive = () => {
  const playersAlive = Entity
    .getByType('player')
    .filter(p => !p.killed)

  if (playersAlive.length === 1 && gameState.started) {
    gameState.lastRoundResult.winner = playersAlive[0].color
    gameState.lastRoundResult.playerFinishOrder =
            gameState.lastRoundResult.playerFinishOrder.concat([playersAlive[0].id])

    transitionToRoundEnd()
  }
}


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
