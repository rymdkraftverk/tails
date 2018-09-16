import l1 from 'l1'
import Scene from './Scene'
import { createTrail, collisionCheckerTrail, createHoleMaker } from './behavior'
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
  const powerupGenerator = l1.entity({
    parent: l1.get(Scene.GAME),
  })

  const generatePowerups = () => ({
    endTime:    l1.getRandomInRange(MINIMUM_GHOST_APPEAR_TIME, MAXIMUM_GHOST_APPEAR_TIME),
    loop:       true,
    onComplete: () => {
      const powerup = l1.sprite({
        x:       l1.getRandomInRange(100, gameWidth - 100),
        y:       l1.getRandomInRange(100, gameHeight - 100),
        width:   64 * (snakeSpeed / speedMultiplier),
        height:  64 * (snakeSpeed / speedMultiplier),
        parent:  powerupGenerator,
        texture: 'powerup-ghost',
      })

      powerup.asset.scale.set((snakeSpeed / speedMultiplier))
      const collisionChecker = () => ({
        onUpdate: () => {
          const collidingEntity = l1
            .getByType('player')
            .find(e => l1.isColliding(e, powerup))
          if (collidingEntity) {
            l1.sound({
              src:    './sounds/join1.wav',
              volume: 0.6,
            })
            l1.destroy(powerup)
            l1.removeBehavior(
              'indicateExpiration',
              collidingEntity,
            )
            l1.removeBehavior(
              'ghost',
              collidingEntity,
            )
            l1.addBehavior(
              ghost({ speedMultiplier }),
              collidingEntity,
            )
          }
        },
      })
      l1.addBehavior(
        collisionChecker(),
        powerup,
      )
    },
  })

  l1.addBehavior(
    generatePowerups(),
    powerupGenerator,
  )
}

const ExpirationState = {
  SOON:     'soon',
  IMMINENT: 'imminent',
}

const ghost = ({
  speedMultiplier,
}) => ({
  id:   'ghost',
  data: {
    expirationState: null,
  },
  endTime: GHOST_POWERUP_DURATION,
  onInit:  ({ entity }) => {
    entity.asset.scale.set(entity.speed / speedMultiplier)
    entity.asset.alpha = 0.4

    l1.removeBehavior(
      'createHoleMaker',
      entity,
    )

    l1.removeBehavior(
      'createTrail',
      entity,
    )

    l1.removeBehavior(
      'collisionCheckerTrail',
      entity,
    )
  },
  onUpdate: ({ counter, data, entity }) => {
    if (
      counter > (GHOST_POWERUP_DURATION * 0.6) &&
      !data.expirationState
    ) {
      data.expirationState = ExpirationState.SOON
      l1.removeBehavior(
        'indicateExpiration',
        entity,
      )
      l1.addBehavior(
        indicateExpiration(60, GHOST_POWERUP_DURATION * 0.4),
        entity,
      )
    } else if (
      counter > (GHOST_POWERUP_DURATION * 0.8) &&
      data.expirationState === ExpirationState.SOON
    ) {
      data.expirationState = ExpirationState.IMMINENT
      l1.removeBehavior(
        'indicateExpiration',
        entity,
      )
      l1.addBehavior(
        indicateExpiration(20, GHOST_POWERUP_DURATION * 0.2),
        entity,
      )
    }
  },
  onComplete: ({ entity }) => {
    if (!entity.killed) {
      l1.removeBehavior(
        'indicateExpiration',
        entity,
      )

      // Reset player
      entity.asset.scale.set((entity.speed / speedMultiplier / 2))
      entity.asset.alpha = 1

      l1.addBehavior(
        collisionCheckerTrail(entity.id, speedMultiplier),
        entity,
      )
      l1.addBehavior(
        createHoleMaker(entity.speed, speedMultiplier),
        entity,
      )
      l1.addBehavior(
        createTrail({
          playerId: entity.id,
          speed:    entity.speed,
          speedMultiplier,
        }),
        entity,
      )

      l1.sound({
        src:    './sounds/powerup-expired.wav',
        volume: 0.6,
        parent: entity,
      })

      l1.removeBehavior(
        'ghost',
        entity,
      )
    }
  },
})

const indicateExpiration = (speed, duration) => ({
  id:      'indicateExpiration',
  endTime: duration,
  data:    {
    sine: createSine({
      start: 0.2,
      end:   0.8,
      speed,
    }),
  },
  onRemove: ({ entity }) => {
    entity.asset.alpha = 1
  },
  onUpdate: ({ counter, data, entity }) => {
    entity.asset.alpha = data.sine(counter)
  },
})
