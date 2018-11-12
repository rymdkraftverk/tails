import * as l1 from 'l1'
import uuid from 'uuid/v4'
import * as PIXI from 'pixi.js'
import R from 'ramda'
import Scene from './Scene'
import Sound from './constant/sound'
import PowerUp from './constant/powerUp'
import ghost from './powerUpGhost'

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
