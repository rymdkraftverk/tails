import { createParabola } from './magic'

export default modifier => ({
  duration: 20,
  onInit:   ({ data, entity }) => {
    data.animation = createParabola({
      start:  0,
      end:    20,
      offset: -1 * entity.asset.scale.x,
      modifier,
    })
  },
  onUpdate: ({ entity, data, counter }) => {
    entity.asset.scale.set(-1 * data.animation(counter))
  },
})
