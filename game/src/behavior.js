import { Entity, Timer, Sprite, Util, Particles, Sound } from 'l1'
import Scene from './Scene'
import explode from './particleEmitter/explode'
import { transitionToRoundEnd } from './roundEnd'
import gameState from './gameState'
import { GameEvent } from './game'
import layers from './util/layers'
import { GAME_WIDTH, GAME_HEIGHT } from './rendering'

const TRAIL_HITBOX_SIZE = 24

const GENERATE_HOLE_MAX_TIME = 300
const GENERATE_HOLE_MIN_TIME = 60

const HOLE_LENGTH_MAX_TIME = 30
const HOLE_LENGTH_MIN_TIME = 10

export const createTrail = ({
  playerId, holeGenerator, speed, speedMultiplier,
}) => ({
  timer: Timer.create({ duration: Math.ceil(2) }),
  run:   (b, e) => {
    if (holeGenerator.preventTrail) {
      return
    }
    const width = TRAIL_HITBOX_SIZE * (speed / speedMultiplier)
    const height = TRAIL_HITBOX_SIZE * (speed / speedMultiplier)

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
      sprite.scale.set(speed / speedMultiplier / 2)
      Timer.reset(b.timer)

      trailE.behaviors.activate = activate()
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

export const holeGenerator = (speed, speedMultiplier) => ({
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
        Math.ceil(HOLE_LENGTH_MIN_TIME * (speedMultiplier / speed)),
        Math.ceil(HOLE_LENGTH_MAX_TIME * (speedMultiplier / speed)),
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

export const collisionCheckerTrail = playerId => ({
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

const killPlayer = (e, speedMultiplier) => {
  const particles = Entity.addChild(e)
  Particles.emit(particles, {
    ...explode({
      degrees:     e.degrees,
      scaleFactor: speedMultiplier / e.speed,
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

export const collisionCheckerWalls = ({
  speedMultiplier, wallThickness,
}) => ({
  timer: Timer.create({ duration: 2 }),
  run:   (b, e) => {
    if (
      Entity.getX(e) < wallThickness ||
      Entity.getX(e) > GAME_WIDTH - wallThickness - e.width ||
      Entity.getY(e) < wallThickness ||
      Entity.getY(e) > GAME_HEIGHT - wallThickness - e.height) {
      killPlayer(e, speedMultiplier)
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