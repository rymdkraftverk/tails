import { Entity, Timer, Util, Sound, Sprite } from 'l1'
import Scene from './Scene'
import { createTrail, holeGenerator, collisionCheckerTrail } from './behavior'
import { createSine } from './magic'

const GHOST_POWERUP_DURATION = 380
const MINIMUM_GHOST_APPEAR_TIME = 400
const MAXIMUM_GHOST_APPEAR_TIME = 600

export const initPowerups = ({
  snakeSpeed,
  speedMultiplier,
  gameWidth,
  gameHeight,
}) => {
  const powerupGenerator = Entity.addChild(Entity.get(Scene.GAME))
  const getNewPowerupTimer = () => Timer
    .create({
      duration: Util.getRandomInRange(MINIMUM_GHOST_APPEAR_TIME, MAXIMUM_GHOST_APPEAR_TIME),
    })

  powerupGenerator.behaviors.generatePowerups = {
    init: (b) => {
      b.timer = getNewPowerupTimer()
    },
    run: (b) => {
      if (Timer.run(b.timer)) {
        const powerup = Entity.addChild(powerupGenerator, {
          x:      Util.getRandomInRange(100, gameWidth - 100),
          y:      Util.getRandomInRange(100, gameHeight - 100),
          width:  64 * (snakeSpeed / speedMultiplier),
          height: 64 * (snakeSpeed / speedMultiplier),
        })
        const sprite = Sprite.show(powerup, {
          texture: 'powerup-ghost',
        })
        sprite.scale.set((snakeSpeed / speedMultiplier))

        b.timer = getNewPowerupTimer()
        powerup.behaviors.collisionChecker = {
          run: () => {
            const collidingEntity = Entity
              .getByType('player')
              .find(e => Entity.isColliding(e, powerup))
            if (collidingEntity) {
              const soundEntity = Entity.addChild(collidingEntity)
              Sound.play(soundEntity, { src: './sounds/join1.wav', volume: 0.6 })
              Entity.destroy(powerup)
              // eslint-disable-next-line fp/no-delete
              delete collidingEntity.behaviors.indicateExpiration
              collidingEntity.behaviors.ghost = ghost({ speedMultiplier })
            }
          },
        }
      }
    },
  }
}

const ExpirationState = {
  SOON:     'soon',
  IMMINENT: 'imminent',
}

const ghost = ({
  speedMultiplier,
}) => ({
  expirationState: null,
  timer:           Timer.create({ duration: GHOST_POWERUP_DURATION }),
  init:            (b, e) => {
    e.asset.scale.set(e.speed / speedMultiplier / 2.5)
    e.asset.alpha = 0.4
    /* eslint-disable fp/no-delete */
    delete e.behaviors.holeGenerator
    delete e.behaviors.createTrail
    delete e.behaviors.collisionCheckerTrail
    /* eslint-enable fp/no-delete */
  },
  run: (b, e) => {
    if (Timer.run(b.timer) && !e.killed) {
      // eslint-disable-next-line fp/no-delete
      delete e.behaviors.indicateExpiration

      // Reset player
      e.asset.scale.set(e.speed / speedMultiplier / 5)
      e.asset.alpha = 1
      e.behaviors.collisionCheckerTrail =
          collisionCheckerTrail(e.id, speedMultiplier)
      e.behaviors.holeGenerator = holeGenerator(e.speed, speedMultiplier)
      e.behaviors.createTrail = createTrail({
        playerId:      e.id,
        holeGenerator: e.behaviors.holeGenerator,
        speed:         e.speed,
        speedMultiplier,
      })

      const powerupExpired = Entity.addChild(e)
      Sound.play(powerupExpired, { src: './sounds/powerup-expired.wav', volume: 0.6 })
      /* eslint-disable fp/no-delete */
      delete e.behaviors.ghost
      /* eslint-enable fp/no-delete */
    }

    if (
      b.timer.counter > (GHOST_POWERUP_DURATION * 0.6) &&
      !b.expirationState
    ) {
      b.expirationState = ExpirationState.SOON
      e.behaviors.indicateExpiration = indicateExpiration(60, GHOST_POWERUP_DURATION * 0.4)
    } else if (
      b.timer.counter > (GHOST_POWERUP_DURATION * 0.8) &&
      b.expirationState === ExpirationState.SOON
    ) {
      b.expirationState = ExpirationState.IMMINENT
      e.behaviors.indicateExpiration = indicateExpiration(20, GHOST_POWERUP_DURATION * 0.2)
    }
  },
})

const indicateExpiration = (speed, duration) => ({
  sine: createSine({
    start: 0.2,
    end:   0.8,
    speed,
  }),
  tick: 0,
  run:  (b, e) => {
    // Safeguarding against this behavior affecting alpha after it's removed
    if (b.tick >= duration - 1) {
      e.asset.alpha = 1
      return
    }
    e.asset.alpha = b.sine(b.tick)
    b.tick += 1
  },
})
