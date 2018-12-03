import * as l1 from 'l1'
import _ from 'lodash/fp'
import uuid from 'uuid/v4'
import * as PIXI from 'pixi.js'
import R from 'ramda'
import Scene from '../Scene'
import Sound from '../constant/sound'
import PowerUp from '../constant/powerUp'
import ghost from './powerUpGhost'
import speed from './powerUpSpeed'
import bounce from '../bounce'

const powerUps = [speed, ghost]

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
      const { texture, behaviorsToRemove, powerUp } = _.sample(powerUps)
      const powerUpSprite = new PIXI.Sprite(texture())
      l1.add(
        powerUpSprite,
        {
          parent: powerupGenerator,
        },
      )

      powerUpSprite.x = l1.getRandomInRange(100, gameWidth - 100)
      powerUpSprite.y = l1.getRandomInRange(100, gameHeight - 100)
      powerUpSprite.scale.set((snakeSpeed / speedMultiplier))
      powerUpSprite.anchor.set(0.5)

      const hitBox = new PIXI.Container()
      hitBox.x = powerUpSprite.x - (powerUpSprite.width / 2)
      hitBox.y = powerUpSprite.y - (powerUpSprite.height / 2)
      hitBox.hitArea = new PIXI.Rectangle(0, 0, powerUpSprite.width, powerUpSprite.height)
      l1.add(
        hitBox,
        {
          parent: powerupGenerator,
        },
      )
      l1.addBehavior(bounce(powerUpSprite, 0.01))

      const collisionCheckerId = uuid()

      const collisionChecker = () => ({
        id:       collisionCheckerId,
        labels:   ['collisionCheckerPowerup'],
        onUpdate: () => {
          const collidingEntity = l1
            .getByLabel('player')
            .find(R.curry(l1.isColliding)(hitBox))
          if (collidingEntity) {
            l1.sound({
              src:    Sound.JOIN1,
              volume: 0.6,
            })
            l1.destroy(powerUpSprite)
            l1.destroy(hitBox)


            R.forEach(
              l1.removeBehavior,
              [
                ...behaviorsToRemove(collidingEntity),
                collisionCheckerId,
              ],
            )

            l1.addBehavior(powerUp({ player: collidingEntity, speedMultiplier, snakeSpeed }))
          }
        },
      })
      l1.addBehavior(collisionChecker())
    },
  })

  l1.addBehavior(generatePowerups())
}
