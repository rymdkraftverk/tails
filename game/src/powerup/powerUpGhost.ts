import * as l1 from '../l1'
import * as l2 from 'l2'
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
    l2.addBehavior({
      id:       `ghost-${player.id}`,
      duration: PowerUp.DURATION,
      onInit:   () => {
        player.scale.set(player.scaleFactor / speedMultiplier)
        player.alpha = 0.4
        player.preventTrail += 1

        const behaviorsToRemove = [
          `collisionCheckerTrail-${player.id}`,
        ]
        behaviorsToRemove.forEach(id => l2.removeBehavior(id))

        l2.addBehavior(indicateExpiration(PowerUp.DURATION, player))
      },
      onComplete: () => {
        if (player.alive) {
        // Reset player
          player.scale.set((player.scaleFactor / speedMultiplier / 2))
          player.alpha = 1

          const behaviorsToAdd = [
            collisionCheckerTrail(player, speedMultiplier),
          ]

          behaviorsToAdd.forEach(behavior => l2.addBehavior(behavior))

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
  behaviorsToRemove: (player: PIXI.Container) => [
    `ghost-${player.id}`,
  ],
} satisfies PowerUpModule
