import * as l1 from '../l1'
import type { Behavior } from '../l1'
import * as PIXI from 'pixi.js'
import Scene from '../Scene'
import Sound from '../constant/sound'
import PowerUp from '../constant/powerUp'
import ghost from './powerUpGhost'
import speed from './powerUpSpeed'
import fat from './powerUpFat'
import bounce from '../bounce'
import indicateExpiration from './indicateExpiration'
import { state } from '../state'
import { sample } from '../util'

const powerUps = [fat, ghost, speed]

const portalTextures = ['portal/portal0', 'portal/portal1', 'portal/portal2']

const PORTAL_APPEAR_CHANCE = 0.5 // Out of 1

export const initPowerups = ({
  snakeSpeed,
  speedMultiplier,
  gameWidth,
  gameHeight,
}: {
  snakeSpeed:      number
  speedMultiplier: number
  gameWidth:       number
  gameHeight:      number
}) => {
  const powerupGenerator = new PIXI.Container()
  l1.add(
    powerupGenerator,
    {
      parent: l1.get(Scene.GAME),
    },
  )

  // We already know which the players are so storing them here
  // as an optimization, to avoid filtering on every tick
  const players = l1.getByLabel('player')

  const getPortalAnimatedSprite = (textures: string[]) => {
    const displayObject = new PIXI.AnimatedSprite(textures.map(l1.getTexture))
    displayObject.animationSpeed = 0.03
    displayObject.scale.set((snakeSpeed / speedMultiplier) * 3)
    displayObject.play()
    return displayObject
  }

  const createPortal = (textures: string[]) => {
    const portalSprite = getPortalAnimatedSprite(textures)
    portalSprite.x = l1.getRandomInRange(100, gameWidth - 100)
    portalSprite.y = l1.getRandomInRange(100, gameHeight - 100)
    portalSprite.anchor.set(0.5)
    l1.addBehavior(bounce(portalSprite, 0.01))
    l1.add(
      portalSprite,
      {
        parent: powerupGenerator,
      },
    )
    return portalSprite
  }

  const createHitBox = (
    sprite: PIXI.Sprite,
    powerupDuration: number,
    onCollision: (collidingPlayer: PIXI.Sprite) => void,
  ) => {
    const hitBox = new PIXI.Container()
    hitBox.x = sprite.x - (sprite.width / 2)
    hitBox.y = sprite.y - (sprite.height / 2)
    hitBox.hitArea = new PIXI.Rectangle(0, 0, sprite.width, sprite.height)
    l1.add(
      hitBox,
      {
        parent: powerupGenerator,
      },
    )

    const destroy = () => {
      l1.destroy(sprite)
      l1.destroy(hitBox)
      l1.removeBehavior(collisionCheckerId)
    }

    const collisionCheckerId = crypto.randomUUID()

    const collisionChecker = {
      id:     collisionCheckerId,
      labels: ['collisionCheckerPowerup'],
      data:   {
        onCollision: () => {},
      },
      onUpdate: ({ data }: Behavior<{ onCollision: () => void }>) => {
        const collidingPlayer = players
          .find(player => player.alive && l1.isColliding(hitBox, player))
        if (collidingPlayer) {
          l1.sound({
            src:    Sound.JOIN1,
            volume: 0.6,
          })
          onCollision(collidingPlayer)
          data.onCollision()
          destroy()
        }
      },
    }

    l1.addBehavior(collisionChecker)

    l1.addBehavior(indicateExpiration(powerupDuration, sprite))
    l1.addBehavior(powerUpSuicideBehavior(powerupDuration, sprite, hitBox, collisionCheckerId))

    return {
      collisionChecker,
      destroy,
    }
  }

  const generatePortals = () => {
    state.portalPairs += 1

    const portal1 = createPortal(portalTextures)
    const portal2 = createPortal(portalTextures)

    const portal1Collision = (collidingPlayer: PIXI.Sprite) => {
      collidingPlayer.x = portal2.x
      collidingPlayer.y = portal2.y
      state.portalPairs -= 1
    }
    const portal2Collision = (collidingPlayer: PIXI.Sprite) => {
      collidingPlayer.x = portal1.x
      collidingPlayer.y = portal1.y
      state.portalPairs -= 1
    }

    const powerupDuration = 3 * l1
      .getRandomInRange(PowerUp.APPEAR_TIME_MINIMUM, PowerUp.APPEAR_TIME_MAXIMUM)
    const hitBox1 = createHitBox(portal1, powerupDuration, portal1Collision)
    const hitBox2 = createHitBox(portal2, powerupDuration, portal2Collision)

    hitBox1.collisionChecker.data.onCollision = hitBox2.destroy
    hitBox2.collisionChecker.data.onCollision = hitBox1.destroy
  }

  const generatePowerups = () => ({
    id:         'generatePowerups',
    duration:   l1.getRandomInRange(PowerUp.SPAWN_TIME_MINIMUM, PowerUp.SPAWN_TIME_MAXIMUM),
    loop:       true,
    onComplete: () => {
      if (Math.random() > PORTAL_APPEAR_CHANCE && state.portalPairs === 0) {
        generatePortals()
      } else {
        // Generate powerups
        const { texture, behaviorsToRemove, powerUp } = sample(powerUps)
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
        l1.addBehavior(bounce(powerUpSprite, 0.01))
        const onCollision = (collidingPlayer: PIXI.Sprite) => {
          behaviorsToRemove(collidingPlayer)
            .forEach(id => l1.removeBehavior(id))

          powerUp({
            player: collidingPlayer, speedMultiplier, snakeSpeed, players,
          })
        }
        const powerupDuration = 3 * l1
          .getRandomInRange(PowerUp.APPEAR_TIME_MINIMUM, PowerUp.APPEAR_TIME_MAXIMUM)
        createHitBox(powerUpSprite, powerupDuration, onCollision)
      }
    },
  })

  l1.addBehavior(generatePowerups())
}

const powerUpSuicideBehavior = (
  duration: number,
  powerupSprite: PIXI.DisplayObject,
  powerupHitbox: PIXI.DisplayObject,
  collisionCheckerId: string,
) => ({
  duration,
  onComplete: () => {
    l1.destroy(powerupSprite)
    l1.destroy(powerupHitbox)
    l1.removeBehavior(collisionCheckerId)
  },
})
