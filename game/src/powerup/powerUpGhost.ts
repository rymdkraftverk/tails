import * as l1 from 'l1'
import type * as PIXI from 'pixi.js'
import Sound from '../constant/sound'
import PowerUp from '../constant/powerUp'
import indicateExpiration from './indicateExpiration'
import { collisionCheckerTrail } from '../collisionDetection'
import type { PowerUpModule, PowerUpOptions } from './types'

export default {
  powerUp: ({
    player, speedMultiplier,
  }: PowerUpOptions) => {
    l1.addBehavior({
      id:   `ghost-${player.id}`,
      data: {
        expirationState: null,
      },
      duration: PowerUp.DURATION,
      onInit:   () => {
        player.scale.set(player.scaleFactor / speedMultiplier)
        player.alpha = 0.4
        player.preventTrail += 1

        const behaviorsToRemove = [
          `collisionCheckerTrail-${player.id}`,
        ]
        behaviorsToRemove.forEach(id => l1.removeBehavior(id))

        l1.addBehavior(indicateExpiration(PowerUp.DURATION, player))
      },
      onComplete: () => {
        if (player.alive) {
        // Reset player
          player.scale.set((player.scaleFactor / speedMultiplier / 2))
          player.alpha = 1

          const behaviorsToAdd = [
            collisionCheckerTrail(player, speedMultiplier),
          ]

          behaviorsToAdd.forEach(behavior => l1.addBehavior(behavior))

          l1.sound({
            src:    Sound.POWERUP_EXPIRED,
            volume: 0.6,
          })
        }
      },
      onRemove: () => {
        player.preventTrail -= 1
      },
    })
  },
  texture:           () => l1.getTexture('powerup/powerup-ghost'),
  behaviorsToRemove: (player: PIXI.Sprite) => [
    `ghost-${player.id}`,
  ],
} satisfies PowerUpModule
