import { createParabola } from './magic'

export default () => ({
  tick: 0,
  init: (b, e) => {
    b.animation = createParabola({
      start:    0,
      end:      20,
      offset:   -1 * e.asset.scale.x,
      modifier: 0.08,
    })
  },
  run: (b, e) => {
    b.tick += 1
    e.asset.scale.set(-1 * b.animation(b.tick))
    if (b.tick >= 20) {
      // TODO: The behavior should not have to know how it is called on the entity
      // eslint-disable-next-line fp/no-delete
      delete e.behaviors.bounce
    }
  },
})
