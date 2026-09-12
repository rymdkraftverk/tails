import type * as PIXI from 'pixi.js'
import type { Behavior } from './l1'
import { createParabola } from './magic'

type BounceData = { animation: (t: number) => number }

export default (displayObject: PIXI.DisplayObject, modifier: number) => ({
  duration: 20,
  data:     {
    animation: createParabola({
      start:  0,
      end:    20,
      offset: -1 * displayObject.scale.x,
      modifier,
    }),
  },
  onUpdate: ({ data, counter }: Behavior<BounceData>) => {
    if (displayObject && !displayObject.l1.isDestroyed()) {
      displayObject.scale.set(-1 * data.animation(counter))
    }
  },
})
