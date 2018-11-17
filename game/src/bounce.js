import { createParabola } from './magic'

export default (displayObject, modifier) => ({
  duration: 20,
  onInit:   ({ data }) => {
    data.animation = createParabola({
      start:  0,
      end:    20,
      offset: -1 * displayObject.scale.x,
      modifier,
    })
  },
  onUpdate: ({ data, counter }) => {
    if (displayObject && !displayObject.l1.isDestroyed()) {
      displayObject.scale.set(-1 * data.animation(counter))
    }
  },
})
