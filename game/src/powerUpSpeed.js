import * as l1 from 'l1'
import Sound from './constant/sound'
import PowerUp from './constant/powerUp'

export default {
  powerUp: ({
    player, speedMultiplier,
  }) => ({
    id:   `speed-${player.playerId}`,
    data: {
      expirationState: null,
    },
    duration: PowerUp.DURATION,
    onInit:   () => {
      player.scale.set(player.speed / speedMultiplier)
      player.alpha = 0.4
    },
    onComplete: () => {
      if (!player.killed) {
      // Reset player
        player.scale.set((player.speed / speedMultiplier / 2))
        player.alpha = 1

        l1.sound({
          src:    Sound.POWERUP_EXPIRED,
          volume: 0.6,
        })

        l1.removeBehavior(`speed-${player.playerId}`)
      }
    },
  }),
  texture:           () => l1.getTexture('powerup-lightning'),
  behaviorsToRemove: () => [],
}
