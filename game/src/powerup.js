import l1 from 'l1'
import R from 'ramda'
import Scene from './Scene'
import { createTrail, collisionCheckerTrail } from './behavior'
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
  const powerupGenerator = l1.container({
    parent: l1.get(Scene.GAME),
  })

  const generatePowerups = () => ({
    endTime:    l1.getRandomInRange(MINIMUM_GHOST_APPEAR_TIME, MAXIMUM_GHOST_APPEAR_TIME),
    loop:       true,
    onComplete: () => {
      const powerup = l1.sprite({
        parent:  powerupGenerator,
        texture: 'powerup-ghost',
      })

      powerup.asset.x = l1.getRandomInRange(100, gameWidth - 100)
      powerup.asset.y = l1.getRandomInRange(100, gameHeight - 100)
      powerup.asset.width = 64 * (snakeSpeed / speedMultiplier)
      powerup.asset.height = 64 * (snakeSpeed / speedMultiplier)

      powerup.asset.scale.set((snakeSpeed / speedMultiplier))
      const collisionChecker = () => ({
        onUpdate: () => {
          const collidingEntity = l1
            .getByType('player')
            .find(l1.isColliding(powerup))
          if (collidingEntity) {
            l1.sound({
              src:    './sounds/join1.wav',
              volume: 0.6,
            })
            l1.destroy(powerup)

            const behaviorsToRemove = [
              'indicateExpiration',
              'ghost',
            ]

            R.forEach(
              l1.removeBehavior(collidingEntity),
              behaviorsToRemove,
            )

            l1.addBehavior(
              collidingEntity,
              ghost({ speedMultiplier }),
            )
          }
        },
      })
      l1.addBehavior(
        powerup,
        collisionChecker(),
      )
    },
  })

  l1.addBehavior(
    powerupGenerator,
    generatePowerups(),
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

    const behaviorsToRemove = [
      'createTrail',
      'collisionCheckerTrail',
    ]
    R.forEach(
      l1.removeBehavior(entity),
      behaviorsToRemove,
    )
  },
  onUpdate: ({ counter, data, entity }) => {
    if (
      counter > (GHOST_POWERUP_DURATION * 0.6) &&
      !data.expirationState
    ) {
      data.expirationState = ExpirationState.SOON
      l1.removeBehavior(
        entity,
        'indicateExpiration',
      )
      l1.addBehavior(
        entity,
        indicateExpiration(60, GHOST_POWERUP_DURATION * 0.4),
      )
    } else if (
      counter > (GHOST_POWERUP_DURATION * 0.8) &&
      data.expirationState === ExpirationState.SOON
    ) {
      data.expirationState = ExpirationState.IMMINENT
      l1.removeBehavior(
        entity,
        'indicateExpiration',
      )
      l1.addBehavior(
        entity,
        indicateExpiration(20, GHOST_POWERUP_DURATION * 0.2),
      )
    }
  },
  onComplete: ({ entity }) => {
    if (!entity.killed) {
      l1.removeBehavior(
        entity,
        'indicateExpiration',
      )

      // Reset player
      entity.asset.scale.set((entity.speed / speedMultiplier / 2))
      entity.asset.alpha = 1

      const behaviorsToAdd = [
        collisionCheckerTrail(entity.id, speedMultiplier),
        createTrail({
          playerId: entity.id,
          speed:    entity.speed,
          speedMultiplier,
        }),
      ]

      R.forEach(
        l1.addBehavior(entity),
        behaviorsToAdd,
      )

      l1.resetBehavior(entity, 'createHoleMaker')

      l1.sound({
        src:    './sounds/powerup-expired.wav',
        volume: 0.6,
        parent: entity,
      })

      l1.removeBehavior(
        entity,
        'ghost',
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
