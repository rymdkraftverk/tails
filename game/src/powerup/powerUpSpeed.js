import * as l1 from 'l1'
import Sound from '../constant/sound'
import PowerUp from '../constant/powerUp'
import { createTrail } from '../trail'

export default {
  powerUp: ({
    player,
    speedMultiplier,
    snakeSpeed,
  }) =>

    ({
      id:       `speed-${player.playerId}`,
      data:     { },
      duration: PowerUp.DURATION,
      onInit:   () => {
        l1.addBehavior(createTrail({
          player,
          scale:    player.scaleFactor,
          speedMultiplier,
          duration: 1,
        }))
        player.speed = snakeSpeed * 1.5
      },
      onComplete: () => {
        if (!player.killed) {
          player.speed = snakeSpeed

          l1.addBehavior(createTrail({
            player,
            scale: player.scaleFactor,
            speedMultiplier,
          }))

          l1.sound({
            src:    Sound.POWERUP_EXPIRED,
            volume: 0.6,
          })
        }
      },
    }),
  texture:           () => l1.getTexture('powerup/powerup-lightning'),
  behaviorsToRemove: () => [],
}
