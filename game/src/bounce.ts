import type * as PIXI from 'pixi.js'
import type { Behavior } from './l1'
import { createParabola } from './magic'

export default (displayObject: PIXI.DisplayObject, modifier: number) => ({
  duration: 20,
  onInit:   ({ data }: Behavior) => {
    data.animation = createParabola({
      start:  0,
      end:    20,
      offset: -1 * displayObject.scale.x,
      modifier,
    })
  },
  onUpdate: ({ data, counter }: Behavior) => {
    if (displayObject && !displayObject.l1.isDestroyed()) {
      displayObject.scale.set(-1 * data.animation(counter))
    }
  },
})
