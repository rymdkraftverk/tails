import * as l1 from 'l1'
import Sound from './constant/sound'
import PowerUp from './constant/powerUp'
import {
  createTrail,
} from './behavior'

export default {
  powerUp: ({
    player,
    speedMultiplier,
  }) => ({
    id:       `speed-${player.playerId}`,
    data:     { },
    duration: PowerUp.DURATION,
    onInit:   () => {
      l1.addBehavior(createTrail({
        player,
        speed:    player.speed,
        speedMultiplier,
        duration: 1,
      }))
      player.speed *= 1.5
    },
    onComplete: () => {
      if (!player.killed) {
        player.speed /= 1.5

        l1.addBehavior(createTrail({
          player,
          speed: player.speed,
          speedMultiplier,
        }))

        l1.sound({
          src:    Sound.POWERUP_EXPIRED,
          volume: 0.6,
        })
      }
    },
  }),
  texture:           () => l1.getTexture('powerup-lightning'),
  behaviorsToRemove: () => [],
}
