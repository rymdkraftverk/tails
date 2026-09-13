import { sound } from 'l2/sound'
import * as l2 from 'l2'
import Sound from '../constant/sound'
import PowerUp from '../constant/powerUp'
import { createTrail } from '../trail'
import { setPlayerSize } from '../game'
import type { PowerUpModule, PowerUpOptions } from './types'

const powerUpBehavior = ({
  player,
  speedMultiplier,
}: Pick<PowerUpOptions, 'player' | 'speedMultiplier'>) => ({
  duration: PowerUp.DURATION,
  onInit:   () => {
    if (player.alive) {
      player.fatLevel += 1
      l2.addBehavior(createTrail({
        player,
        scale: player.scaleFactor * player.fatLevel,
        speedMultiplier,
      }))
      setPlayerSize(player, player.fatLevel)
    }
  },
  onComplete: () => {
    if (player.alive) {
      player.fatLevel -= 1
      setPlayerSize(player, player.fatLevel)
      l2.addBehavior(createTrail({
        player,
        scale: player.scaleFactor * player.fatLevel,
        speedMultiplier,
      }))

      sound({
        src:    Sound.POWERUP_EXPIRED,
        volume: 0.6,
      })
    }
  },
})

export default {
  powerUp: ({
    player,
    speedMultiplier,
    players,
  }: PowerUpOptions) => {
    players.forEach((p) => {
      // Don't apply on the player who picked up the fat powerup
      if (l2.getId(p) === l2.getId(player)) {
        return
      }
      l2.addBehavior(powerUpBehavior({ player: p, speedMultiplier }))
    })
  },
  texture:           () => l2.getTexture('powerup/powerup-sumo'),
  behaviorsToRemove: () => [],
} satisfies PowerUpModule
