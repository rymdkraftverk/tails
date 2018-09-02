import { Entity, Timer, Util, Sound, Sprite } from 'l1'
import Scene from './Scene'
import { createTrail, holeGenerator, collisionCheckerTrail } from './behavior'

const GHOST_POWERUP_DURATION = 500
const MINIMUM_GHOST_APPEAR_TIME = 400
const MAXIMUM_GHOST_APPEAR_TIME = 600

export const initPowerups = ({
  playerCountFactor,
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
              collidingEntity.behaviors.ghost = ghost({ playerCountFactor, speedMultiplier })
            }
          },
        }
      }
    },
  }
}

const ghost = ({
  playerCountFactor,
  speedMultiplier,
}) => ({
  timer: Timer.create({ duration: GHOST_POWERUP_DURATION }),
  init:  (b, e) => {
    // Scale up player 3 times
    e.asset.scale.set((e.speed / speedMultiplier / 2) * 3)
    e.asset.alpha = 0.4
    /* eslint-disable fp/no-delete */
    delete e.behaviors.holeGenerator
    delete e.behaviors.createTrail
    delete e.behaviors.collisionCheckerTrail
    /* eslint-enable fp/no-delete */
  },
  run: (b, e) => {
    if (Timer.run(b.timer) && !e.killed) {
      // Reset player
      e.asset.scale.set((e.speed / speedMultiplier / 2))
      e.asset.alpha = 1
      e.behaviors.collisionCheckerTrail =
          collisionCheckerTrail(e.id, playerCountFactor)
      e.behaviors.holeGenerator = holeGenerator(e.speed, speedMultiplier)
      e.behaviors.createTrail = createTrail({
        playerId:      e.id,
        holeGenerator: e.behaviors.holeGenerator,
        speed:         e.speed,
        speedMultiplier,
      })
    }
  },
})
