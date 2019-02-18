import * as l1 from 'l1'
import R from 'ramda'
import Sound from '../constant/sound'
import PowerUp from '../constant/powerUp'
import indicateExpiration from './indicateExpiration'
import { collisionCheckerTrail } from '../collisionDetection'

export default {
  powerUp: ({
    player, speedMultiplier,
  }) => ({
    id:   `ghost-${player.playerId}`,
    data: {
      expirationState: null,
    },
    duration: PowerUp.DURATION,
    onInit:   () => {
      player.scale.set(player.scaleFactor / speedMultiplier)
      player.alpha = 0.4
      player.preventTrail += 1

      const behaviorsToRemove = [
        `collisionCheckerTrail-${player.playerId}`,
      ]
      R.forEach(
        l1.removeBehavior,
        behaviorsToRemove,
      )

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

        R.forEach(
          l1.addBehavior,
          behaviorsToAdd,
        )

        l1.sound({
          src:    Sound.POWERUP_EXPIRED,
          volume: 0.6,
        })
      }
    },
    onRemove: () => {
      player.preventTrail -= 1
    },
  }),
  texture:           () => l1.getTexture('powerup/powerup-ghost'),
  behaviorsToRemove: player => [
    `ghost-${player.playerId}`,
  ],
}
