import * as l2 from 'l2'
import type * as PIXI from 'pixi.js'
import type { Behavior } from 'l2'
import { createParabola } from './magic'

type BounceData = { animation: ((t: number) => number) | null }

export default (displayObject: PIXI.Container, modifier: number) => ({
  duration: 20,
  data:     { animation: null } as BounceData,
  onInit:   ({ data }: Behavior<BounceData>) => {
    if (l2.isDestroyed(displayObject)) {
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
    if (data.animation && !l2.isDestroyed(displayObject)) {
      displayObject.scale.set(-1 * data.animation(counter))
    }
  },
})
