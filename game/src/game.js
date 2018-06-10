import { Entity, Util, Timer, Game } from 'l1'
import uuid from 'uuid/v4'
import { LEFT, RIGHT, GAME_WIDTH, GAME_HEIGHT, game } from '.'
import { players } from './lobby'
import { transitionToGameover } from './gameover'

const { log } = console

const TURN_RADIUS = 3
const SPEED_MULTIPLIER = 1.2

const GENERATE_HOLE_MAX_TIME = 300
const GENERATE_HOLE_MIN_TIME = 60

const HOLE_LENGTH_MAX_TIME = 30
const HOLE_LENGTH_MIN_TIME = 10

const WALL_THICKNESS = 6

export function gameState() {
  Entity.getAll()
    .filter(e => e.id !== 'background')
    .forEach(Entity.destroy)

  Object.values(players)
    .forEach(createPlayer)

  const walls = Entity.create('walls')
  walls.behaviors.renderWalls = renderWalls()
}

function createPlayer({ playerId, spriteId, color }, index) {
  const square = Entity.create(playerId)
  const sprite = Entity.addSprite(square, spriteId)
  Entity.addType(square, 'player')
  sprite.x = 150 + ((index % 5) * 200)
  sprite.y = 150 + (index > 4 ? 300 : 0)
  sprite.scale.set(0.3)
  square.color = color
  square.isAlive = true
  square.behaviors.startPlayerMovement = startPlayerMovement(square, playerId, spriteId)
}

const startPlayerMovement = (player, playerId, spriteId) => ({
  timer: Timer.create(60),
  run:   (b) => {
    if (b.timer.run()) {
      player.behaviors.pivot = pivot(playerId)
      player.behaviors.holeGenerator = holeGenerator()
      player.behaviors.createTrail = createTrail(playerId, spriteId, player.behaviors.holeGenerator)
      player.behaviors.move = move(Util.getRandomInRange(0, 360))
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

const move = startingDegrees => ({
  init: (b, e) => {
    e.degrees = startingDegrees
  },
  run: (b, e) => {
    const radians = toRadians(e.degrees)
    const y = Math.cos(radians)
    const x = Math.sin(radians)
    e.sprite.x += x * SPEED_MULTIPLIER
    e.sprite.y += y * SPEED_MULTIPLIER
  },
})

const pivot = playerId => ({
  run: (b, e) => {
    if (Entity.get(`${playerId}controller`).direction === LEFT) {
      if (e.degrees >= 360) {
        e.degrees = 0
        return
      }
      e.degrees += TURN_RADIUS
    } else if (Entity.get(`${playerId}controller`).direction === RIGHT) {
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

const createTrail = (playerId, spriteId, holeGenerator) => ({
  timer: Timer.create(2),
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
      sprite.scale.set(0.2)
      sprite.x = e.sprite.x + ((e.sprite.width / 2) - (sprite.width / 2))
      sprite.y = e.sprite.y + ((e.sprite.height / 2) - (sprite.height / 2))
      b.timer.reset()

      trailE.behaviors.activate = activate()
    }
  },
})

const holeGenerator = () => ({
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

      const rand = Util.getRandomInRange(GENERATE_HOLE_MIN_TIME, GENERATE_HOLE_MAX_TIME)
      b.generateHoleTimer = Timer.create(rand)

      b.holeLengthTimer = null
    }
  },
})

/* This behavior is needed so that the player wont immediately collide with its own tail */
const activate = () => ({
  timer: Timer.create(5),
  run:   (b, e) => {
    if (b.timer.run()) {
      e.active = true
    }
  },
})

const collisionChecker = playerId => ({
  timer: Timer.create(2),
  run:   (b, e) => {
    if (b.timer.run()) {
      const allTrails = Entity
        .getByType('trail')
        .filter(t => t.active || t.player !== playerId)

      if (allTrails.some(t => Entity.isColliding(t, e))) {
        Entity.destroy(e)
      } else if (
        e.sprite.x < WALL_THICKNESS ||
        e.sprite.x > GAME_WIDTH - WALL_THICKNESS - e.sprite.width ||
        e.sprite.y < WALL_THICKNESS ||
        e.sprite.y > GAME_HEIGHT - WALL_THICKNESS - e.sprite.height) {
        Entity.destroy(e)
        log('PLAYER DIED DUE TO OUT OF BOUNDS!')
      }
      if (Entity.getByType('player').length === 1 && game.started) {
        game.started = false
        game.lastResult.winner = Entity.getByType('player')[0].color
        transitionToGameover()
      }
      b.timer.reset()
    }
  },
})

const renderWalls = () => ({
  run: () => {
    const graphics = Game.getGraphics()
    graphics.lineStyle(WALL_THICKNESS, 0xffffff, 1)

    graphics.moveTo(0, 0)
    graphics.lineTo(GAME_WIDTH, 0)
    graphics.lineTo(GAME_WIDTH, GAME_HEIGHT)
    graphics.lineTo(0, GAME_HEIGHT)
    graphics.lineTo(0, 0)
  },
})
