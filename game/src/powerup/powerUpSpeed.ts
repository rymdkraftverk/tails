import { sound } from 'l2/sound'
import * as l2 from 'l2'
import Sound from '../constant/sound'
import PowerUp from '../constant/powerUp'
import { createTrail } from '../trail'
import type { PowerUpModule, PowerUpOptions } from './types'

export default {
  powerUp: ({
    player,
    speedMultiplier,
    snakeSpeed,
  }: PowerUpOptions) => {
    l2.addBehavior({
      id:       `speed-${player.id}`,
      duration: PowerUp.DURATION,
      onInit:   () => {
        l2.addBehavior(createTrail({
          player,
          scale:    player.scaleFactor,
          speedMultiplier,
          duration: 1,
        }))
        player.speed = snakeSpeed * 1.5
      },
      onComplete: () => {
        if (player.alive) {
          player.speed = snakeSpeed

          l2.addBehavior(createTrail({
            player,
            scale: player.scaleFactor,
            speedMultiplier,
          }))

          sound({
            src:    Sound.POWERUP_EXPIRED,
            volume: 0.6,
          })
        }
      },
    })
  },
  texture:           () => l2.getTexture('powerup/powerup-lightning'),
  behaviorsToRemove: () => [],
} satisfies PowerUpModule
