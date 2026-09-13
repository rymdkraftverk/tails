import * as l2 from 'l2'
import type { Behavior } from 'l2'
import type * as PIXI from 'pixi.js'
import { createSine } from '../magic'

const EXPIRATION_STATE_SOON = 'EXPIRATION_STATE_SOON'
const EXPIRATION_STATE_IMMINENT = 'EXPIRATION_STATE_IMMINENT'

const SOON_TIME_LIMIT = 4 * 60 // 4s
const IMMINENT_TIME_LIMIT = SOON_TIME_LIMIT / 2

const fluctuateOpacityBehavior = (entity: PIXI.Container, speed: number, duration: number) => ({
  id:   `fluctuateOpacity-${l2.getId(entity)}`,
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
  onUpdate: ({ counter, data }: Behavior<{ sine: (t: number) => number }>) => {
    entity.alpha = data.sine(counter)
  },
})

type ExpirationData = { expirationState: string | null }

const indicateExpirationBehavior = (duration: number, entity: PIXI.Container) => ({
  data:     { expirationState: null } as ExpirationData,
  onUpdate: ({ counter, data }: Behavior<ExpirationData>) => {
    if (
      (duration - counter) < SOON_TIME_LIMIT
    && !data.expirationState
    ) {
      data.expirationState = EXPIRATION_STATE_SOON
      l2.removeBehavior(`fluctuateOpacity-${l2.getId(entity)}`)

      // the duration of "soon" until it's cut off by "imminent"
      const soonDuration = SOON_TIME_LIMIT - IMMINENT_TIME_LIMIT
      l2.addBehavior(fluctuateOpacityBehavior(entity, 60, soonDuration))
    } else if (
      (duration - counter) < IMMINENT_TIME_LIMIT
    && data.expirationState === EXPIRATION_STATE_SOON
    ) {
      data.expirationState = EXPIRATION_STATE_IMMINENT
      l2.removeBehavior(`fluctuateOpacity-${l2.getId(entity)}`)
      l2.addBehavior(fluctuateOpacityBehavior(entity, 20, IMMINENT_TIME_LIMIT))
    }
  },
  onComplete: () => {
    l2.removeBehavior(`fluctuateOpacity-${l2.getId(entity)}`)
    entity.alpha = 1
  },
})

export default indicateExpirationBehavior
