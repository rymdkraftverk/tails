import { shuffle } from 'lodash/fp'
import R from 'ramda'
import { Entity, Util, Timer, Game, Sound } from 'l1'
import uuid from 'uuid/v4'
import { COLORS } from 'common'
import { LEFT, RIGHT, GAME_WIDTH, GAME_HEIGHT, game } from '.'
import { players } from './lobby'
import deathExplosion from './particleEmitterConfigs/deathExplosion.json'
import { transitionToGameover } from './gameover'

const { log } = console

const TURN_RADIUS = 3
const SPEED_MULTIPLIER = 3.6

const GENERATE_HOLE_MAX_TIME = 300
const GENERATE_HOLE_MIN_TIME = 60

const HOLE_LENGTH_MAX_TIME = 90
const HOLE_LENGTH_MIN_TIME = 30

const WALL_THICKNESS = 6
const WALL_COLOR = 0xffffff

export function gameState(maxPlayers) {
  Entity.getAll()
    .filter(e => e.id !== 'background')
    .forEach(Entity.destroy)

  const playerCountFactor = R.compose(
    Math.sqrt,
    R.length,
    Object.values,
  )(players)

  R.compose(
    R.zipWith(createPlayer(playerCountFactor), shuffle(R.range(0, maxPlayers))),
    shuffle,
    Object.values,
  )(players)

  const walls = Entity.create('walls')
  walls.behaviors.renderWalls = renderWalls()
}

const createPlayer = R.curry((playerCountFactor, index, { playerId, spriteId, color }) => {
  const square = Entity.create(playerId)
  const sprite = Entity.addSprite(square, spriteId)
  Entity.addType(square, 'player')
  sprite.x = 150 + ((index % 5) * 200)
  sprite.y = 150 + (index > 4 ? 300 : 0)
  sprite.scale.set(1 / playerCountFactor)
  square.color = color
  square.isAlive = true
  square.behaviors.startPlayerMovement = startPlayerMovement(playerCountFactor, square, playerId, spriteId)
  Entity.addEmitter(square, {
    id:       playerId,
    textures: [Game.getTexture('particle')],
  })
})

const startPlayerMovement = (playerCountFactor, player, playerId, spriteId) => ({
  timer: Timer.create(60),
  run:   (b) => {
    if (b.timer.run()) {
      player.behaviors.pivot = pivot(playerId)
      player.behaviors.holeGenerator = holeGenerator(playerCountFactor)
      player.behaviors.createTrail = createTrail(playerCountFactor, playerId, spriteId, player.behaviors.holeGenerator)
      player.behaviors.move = move({
        startingDegrees: Util.getRandomInRange(0, 360),
        playerCountFactor,
      })
      player.behaviors.collisionChecker = collisionChecker(playerId)

      // Enable the following behaviour for keyboard debugging
      // square.behaviors.player1Keyboard = player1Keyboard()
      const controller = Entity.create(`${playerId}controller`)
      controller.direction = null
    }
  },
})


function toRadians(angle) {
  return angle * (Math.PI / 180)
}

const move = ({ startingDegrees, playerCountFactor }) => ({
  init: (b, e) => {
    e.degrees = startingDegrees
  },
  run: (b, e) => {
    const radians = toRadians(e.degrees)
    const y = Math.sin(radians)
    const x = Math.cos(radians)
    e.sprite.x += (x * SPEED_MULTIPLIER) / playerCountFactor
    e.sprite.y += (y * SPEED_MULTIPLIER) / playerCountFactor
  },
})

const pivot = playerId => ({
  run: (b, e) => {
    if (Entity.get(`${playerId}controller`).direction === RIGHT) {
      if (e.degrees >= 360) {
        e.degrees = 0
        return
      }
      e.degrees += TURN_RADIUS
    } else if (Entity.get(`${playerId}controller`).direction === LEFT) {
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

const createTrail = (playerCountFactor, playerId, spriteId, holeGenerator) => ({
  timer: Timer.create(Math.ceil(2)),
  run:   (b, e) => {
    if (holeGenerator.preventTrail) {
      return
    }
    if (b.timer.run()) {
      const trailE = Entity.create(`trail${uuid()}`)
      trailE.active = false
      trailE.player = playerId
      Entity.addType(trailE, 'trail')
      const sprite = Entity.addSprite(trailE, spriteId)
      sprite.scale.set(1 / playerCountFactor)
      sprite.x = e.sprite.x + ((e.sprite.width / 2) - (sprite.width / 2))
      sprite.y = e.sprite.y + ((e.sprite.height / 2) - (sprite.height / 2))
      b.timer.reset()

      trailE.behaviors.activate = activate(playerCountFactor)
    }
  },
})

const holeGenerator = playerCountFactor => ({
  preventTrail:      false,
  generateHoleTimer: Timer
    .create(Util.getRandomInRange(GENERATE_HOLE_MIN_TIME, GENERATE_HOLE_MAX_TIME)),
  holeLengthTimer: null,
  run:             (b) => {
    if (b.generateHoleTimer && b.generateHoleTimer.run()) {
      b.preventTrail = true

      const rand = Util.getRandomInRange(HOLE_LENGTH_MIN_TIME, HOLE_LENGTH_MAX_TIME)
      b.holeLengthTimer = Timer.create(rand)

      b.generateHoleTimer = null
    } else if (b.holeLengthTimer && b.holeLengthTimer.run()) {
      b.preventTrail = false

      const rand = Util.getRandomInRange(
        Math.ceil(GENERATE_HOLE_MIN_TIME * playerCountFactor),
        Math.ceil(GENERATE_HOLE_MAX_TIME * playerCountFactor),
      )
      b.generateHoleTimer = Timer.create(rand)

      b.holeLengthTimer = null
    }
  },
})

/* This behavior is needed so that the player wont immediately collide with its own tail */
const activate = playerCountFactor => ({
  timer: Timer.create(Math.floor(15 * playerCountFactor)),
  run:   (b, e) => {
    if (b.timer.run()) {
      e.active = true
    }
  },
})

const killPlayer = (e, playerId) => {
  const updatedDeathExplosion = {
    ...deathExplosion,
    pos: {
      x: e.sprite.position.x,
      y: e.sprite.position.y,
    },
    startRotation: {
      min: e.degrees - 30,
      max: e.degrees + 30,
    },
    color: {
      start: COLORS[e.color],
      end:   COLORS[e.color],
    },
  }

  Entity.emitEmitter(e, {
    id:     playerId,
    config: updatedDeathExplosion,
  })

  const explosion = Sound.getSound('./sounds/explosion.wav', { volume: 0.6 })
  explosion.play()

  e.killed = true
  /* eslint-disable fp/no-delete */
  delete e.behaviors.collisionChecker
  delete e.behaviors.holeGenerator
  delete e.behaviors.createTrail
  delete e.behaviors.move
  delete e.behaviors.pivot
  /* eslint-enable fp/no-delete */
}

const collisionChecker = playerId => ({
  timer: Timer.create(2),
  run:   (b, e) => {
    if (b.timer.run()) {
      const allTrails = Entity
        .getByType('trail')
        .filter(t => t.active || t.player !== playerId)

      if (allTrails.some(t => Entity.isColliding(t, e))) {
        killPlayer(e, playerId)
      } else if (
        e.sprite.x < WALL_THICKNESS ||
        e.sprite.x > GAME_WIDTH - WALL_THICKNESS - e.sprite.width ||
        e.sprite.y < WALL_THICKNESS ||
        e.sprite.y > GAME_HEIGHT - WALL_THICKNESS - e.sprite.height) {
        killPlayer(e, playerId)
        log('PLAYER DIED DUE TO OUT OF BOUNDS!')
      }
      const playersAlive = Entity.getByType('player').filter(p => !p.killed)
      if (playersAlive.length === 1 && game.started) {
        game.started = false
        game.lastResult.winner = playersAlive[0].color
        transitionToGameover()
      }
      b.timer.reset()
    }
  },
})

const renderWalls = () => ({
  run: () => {
    const graphics = Game.getGraphics()
    graphics.lineStyle(WALL_THICKNESS, WALL_COLOR, 1)

    graphics.moveTo(0, 0)
    graphics.lineTo(GAME_WIDTH, 0)
    graphics.lineTo(GAME_WIDTH, GAME_HEIGHT)
    graphics.lineTo(0, GAME_HEIGHT)
    graphics.lineTo(0, 0)
  },
})
