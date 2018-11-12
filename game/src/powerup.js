import * as l1 from 'l1'
import uuid from 'uuid/v4'
import * as PIXI from 'pixi.js'
import R from 'ramda'
import Scene from './Scene'
import { createTrail, collisionCheckerTrail } from './behavior'
import { createSine } from './magic'
import Sound from './constant/sound'
import PowerUp from './constant/powerUp'

export const initPowerups = ({
  snakeSpeed,
  speedMultiplier,
  gameWidth,
  gameHeight,
}) => {
  const powerupGenerator = new PIXI.Container()
  l1.add(
    powerupGenerator,
    {
      parent: l1.get(Scene.GAME),
    },
  )

  const generatePowerups = () => ({
    id:         'generatePowerups',
    duration:   l1.getRandomInRange(PowerUp.APPEAR_TIME_MINIMUM, PowerUp.APPEAR_TIME_MAXIMUM),
    loop:       true,
    onComplete: () => {
      const powerup = new PIXI.Sprite(l1.getTexture('powerup-ghost'))
      l1.add(
        powerup,
        {
          parent: powerupGenerator,
        },
      )

      powerup.x = l1.getRandomInRange(100, gameWidth - 100)
      powerup.y = l1.getRandomInRange(100, gameHeight - 100)
      powerup.width = 64 * (snakeSpeed / speedMultiplier)
      powerup.height = 64 * (snakeSpeed / speedMultiplier)
      powerup.scale.set((snakeSpeed / speedMultiplier))

      const collisionCheckerId = uuid()

      const collisionChecker = () => ({
        id:       collisionCheckerId,
        labels:   ['collisionCheckerPowerup'],
        onUpdate: () => {
          const collidingEntity = l1
            .getByLabel('player')
            .find(R.curry(l1.isColliding)(powerup))
          if (collidingEntity) {
            l1.sound({
              src:    Sound.JOIN1,
              volume: 0.6,
            })
            l1.destroy(powerup)

            const behaviorsToRemove = [
              collisionCheckerId,
              `indicateExpiration-${collidingEntity.playerId}`,
              `ghost-${collidingEntity.playerId}`,
            ]

            R.forEach(
              l1.removeBehavior,
              behaviorsToRemove,
            )

            l1.addBehavior(ghost({ player: collidingEntity, speedMultiplier }))
          }
        },
      })
      l1.addBehavior(collisionChecker())
    },
  })

  l1.addBehavior(generatePowerups())
}

const ghost = ({
  player, speedMultiplier,
}) => ({
  id:   `ghost-${player.playerId}`,
  data: {
    expirationState: null,
  },
  duration: PowerUp.DURATION,
  onInit:   () => {
    player.scale.set(player.speed / speedMultiplier)
    player.alpha = 0.4

    const behaviorsToRemove = [
      `createTrail-${player.playerId}`,
      `collisionCheckerTrail-${player.playerId}`,
    ]
    R.forEach(
      l1.removeBehavior,
      behaviorsToRemove,
    )
  },
  onUpdate: ({ counter, data }) => {
    if (
      counter > (PowerUp.DURATION * 0.6) &&
      !data.expirationState
    ) {
      data.expirationState = PowerUp.EXPIRATION_STATE_SOON
      l1.removeBehavior(`indicateExpiration-${player.playerId}`)
      l1.addBehavior(indicateExpiration(player, 60, PowerUp.DURATION * 0.4))
    } else if (
      counter > (PowerUp.DURATION * 0.8) &&
      data.expirationState === PowerUp.EXPIRATION_STATE_SOON
    ) {
      data.expirationState = PowerUp.EXPIRATION_STATE_IMMINENT
      l1.removeBehavior(`indicateExpiration-${player.playerId}`)
      l1.addBehavior(indicateExpiration(player, 20, PowerUp.DURATION * 0.2))
    }
  },
  onComplete: () => {
    if (!player.killed) {
      l1.removeBehavior(`indicateExpiration-${player.playerId}`)

      // Reset player
      player.scale.set((player.speed / speedMultiplier / 2))
      player.alpha = 1

      const behaviorsToAdd = [
        collisionCheckerTrail(player, speedMultiplier),
        createTrail({
          player,
          speed: player.speed,
          speedMultiplier,
        }),
      ]

      R.forEach(
        l1.addBehavior,
        behaviorsToAdd,
      )

      l1.resetBehavior(`createHoleMaker-${player.playerId}`)

      l1.sound({
        src:    Sound.POWERUP_EXPIRED,
        volume: 0.6,
      })

      l1.removeBehavior(`ghost-${player.playerId}`)
    }
  },
})

const indicateExpiration = (player, speed, duration) => ({
  id:   `indicateExpiration-${player.playerId}`,
  duration,
  data: {
    sine: createSine({
      start: 0.2,
      end:   0.8,
      speed,
    }),
  },
  onRemove: () => {
    player.alpha = 1
  },
  onUpdate: ({ counter, data }) => {
    player.alpha = data.sine(counter)
  },
})
