import type * as PIXI from 'pixi.js'
import type { Behavior } from './l1'
import { createParabola } from './magic'

type BounceData = { animation: ((t: number) => number) | null }

export default (displayObject: PIXI.Container, modifier: number) => ({
  duration: 20,
  data:     { animation: null } as BounceData,
  onInit:   ({ data }: Behavior<BounceData>) => {
    if (displayObject.l1.isDestroyed()) {
      return
    }

    data.animation = createParabola({
      start:  0,
      end:    20,
      offset: -1 * displayObject.scale.x,
      modifier,
    })
  },
  onUpdate: ({ data, counter }: Behavior<BounceData>) => {
    if (data.animation && !displayObject.l1.isDestroyed()) {
      displayObject.scale.set(-1 * data.animation(counter))
    }
  },
})
