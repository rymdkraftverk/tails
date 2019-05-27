import * as l1 from 'l1'
import Sound from '../constant/sound'
import PowerUp from '../constant/powerUp'
import { createTrail } from '../trail'
import { setPlayerSize } from '../game'

const powerUpBehavior = ({ player, speedMultiplier }) => ({
  duration: PowerUp.DURATION,
  onInit:   () => {
    if (player.alive) {
      player.fatLevel += 1
      l1.addBehavior(createTrail({
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
      l1.addBehavior(createTrail({
        player,
        scale: player.scaleFactor * player.fatLevel,
        speedMultiplier,
      }))

      l1.sound({
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
  }) => {
    players.forEach((p) => {
      // Don't apply on the player who picked up the fat powerup
      if (p.l1.id === player.l1.id) {
        return
      }
      l1.addBehavior(powerUpBehavior({ player: p, speedMultiplier }))
    })
  },
  texture:           () => l1.getTexture('powerup/powerup-sumo'),
  behaviorsToRemove: () => [],
}
