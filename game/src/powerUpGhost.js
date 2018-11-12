import * as l1 from 'l1'
import R from 'ramda'
import Sound from './constant/sound'
import PowerUp from './constant/powerUp'
import {
  indicateExpiration,
  createTrail,
  collisionCheckerTrail,
} from './behavior'

export default ({
  player, speedMultiplier,
}) => ({
  id:   `ghost-${player.playerId}`,
  data: {
    expirationState: null,
  },
  duration: PowerUp.DURATION,
  onInit:   () => {
    player.scale.set(player.speed / speedMultiplier)
    player.alpha = 0.4

    const behaviorsToRemove = [
      `createTrail-${player.playerId}`,
      `collisionCheckerTrail-${player.playerId}`,
    ]
    R.forEach(
      l1.removeBehavior,
      behaviorsToRemove,
    )
  },
  onUpdate: ({ counter, data }) => {
    if (
      counter > (PowerUp.DURATION * 0.6) &&
      !data.expirationState
    ) {
      data.expirationState = PowerUp.EXPIRATION_STATE_SOON
      l1.removeBehavior(`indicateExpiration-${player.playerId}`)
      l1.addBehavior(indicateExpiration(player, 60, PowerUp.DURATION * 0.4))
    } else if (
      counter > (PowerUp.DURATION * 0.8) &&
      data.expirationState === PowerUp.EXPIRATION_STATE_SOON
    ) {
      data.expirationState = PowerUp.EXPIRATION_STATE_IMMINENT
      l1.removeBehavior(`indicateExpiration-${player.playerId}`)
      l1.addBehavior(indicateExpiration(player, 20, PowerUp.DURATION * 0.2))
    }
  },
  onComplete: () => {
    if (!player.killed) {
      l1.removeBehavior(`indicateExpiration-${player.playerId}`)

      // Reset player
      player.scale.set((player.speed / speedMultiplier / 2))
      player.alpha = 1

      const behaviorsToAdd = [
        collisionCheckerTrail(player, speedMultiplier),
        createTrail({
          player,
          speed: player.speed,
          speedMultiplier,
        }),
      ]

      R.forEach(
        l1.addBehavior,
        behaviorsToAdd,
      )

      l1.resetBehavior(`createHoleMaker-${player.playerId}`)

      l1.sound({
        src:    Sound.POWERUP_EXPIRED,
        volume: 0.6,
      })

      l1.removeBehavior(`ghost-${player.playerId}`)
    }
  },
})
