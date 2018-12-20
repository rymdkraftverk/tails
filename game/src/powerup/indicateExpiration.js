import * as l1 from 'l1'
import R from 'ramda'
import { createSine } from '../magic'

const EXPIRATION_STATE_SOON = 'EXPIRATION_STATE_SOON'
const EXPIRATION_STATE_IMMINENT = 'EXPIRATION_STATE_IMMINENT'

const SOON_TIME_LIMIT = 4 * 60 // 4s
const IMMINENT_TIME_LIMIT = SOON_TIME_LIMIT / 2

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
      (duration - counter) < SOON_TIME_LIMIT
    && !data.expirationState
    ) {
      data.expirationState = EXPIRATION_STATE_SOON
      l1.removeBehavior(`fluctuateOpacity-${entity.l1.id}`)

      // the duration of "soon" until it's cut off by "imminent"
      const soonDuration = SOON_TIME_LIMIT - IMMINENT_TIME_LIMIT
      l1.addBehavior(fluctuateOpacityBehavior(entity, 60, soonDuration))
    } else if (
      (duration - counter) < IMMINENT_TIME_LIMIT
    && data.expirationState === EXPIRATION_STATE_SOON
    ) {
      data.expirationState = EXPIRATION_STATE_IMMINENT
      l1.removeBehavior(`fluctuateOpacity-${entity.l1.id}`)
      l1.addBehavior(fluctuateOpacityBehavior(entity, 20, IMMINENT_TIME_LIMIT))
    }
  },
  onComplete: () => {
    l1.removeBehavior(`fluctuateOpacity-${entity.l1.id}`)
    entity.alpha = 1
  },
}))

export default indicateExpirationBehavior
