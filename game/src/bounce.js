import { createParabola } from './magic'

export default modifier => ({
  tick: 0,
  init: (b, e) => {
    b.animation = createParabola({
      start:  0,
      end:    20,
      offset: -1 * e.asset.scale.x,
      modifier,
    })
  },
  run: (b, e) => {
    b.tick += 1
    e.asset.scale.set(-1 * b.animation(b.tick))
    if (b.tick >= 20) {
      // eslint-disable-next-line fp/no-delete
      delete e.behaviors.bounce
    }
  },
})
