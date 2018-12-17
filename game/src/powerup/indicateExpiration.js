import * as l1 from 'l1'
import R from 'ramda'
import { createSine } from '../magic'
import PowerUp from '../constant/powerUp'

const fluctuateOpacityBehavior = (entity, speed, duration) => ({
  id:   `fluctuateOpacity-${entity.l1.id}`,
  duration,
  data: {
    sine: createSine({
      start: 0.2,
      end:   0.8,
      speed,
    }),
  },
  onRemove: () => {
    entity.alpha = 1
  },
  onUpdate: ({ counter, data }) => {
    entity.alpha = data.sine(counter)
  },
})

const indicateExpirationBehavior = R.curry((duration, entity) => ({
  onUpdate: ({ counter, data }) => {
    if (
      counter > (PowerUp.DURATION * 0.6)
    && !data.expirationState
    ) {
      data.expirationState = PowerUp.EXPIRATION_STATE_SOON
      l1.removeBehavior(`fluctuateOpacity-${entity.l1.id}`)
      l1.addBehavior(fluctuateOpacityBehavior(entity, 60, duration * 0.4))
    } else if (
      counter > (PowerUp.DURATION * 0.8)
    && data.expirationState === PowerUp.EXPIRATION_STATE_SOON
    ) {
      data.expirationState = PowerUp.EXPIRATION_STATE_IMMINENT
      l1.removeBehavior(`fluctuateOpacity-${entity.l1.id}`)
      l1.addBehavior(fluctuateOpacityBehavior(entity, 20, duration * 0.2))
    }
  },
  onComplete: () => {
    l1.removeBehavior(`fluctuateOpacity-${entity.l1.id}`)
    entity.alpha = 1
  },
}))

export default indicateExpirationBehavior
