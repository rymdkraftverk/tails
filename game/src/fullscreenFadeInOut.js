import l1 from 'l1'
import { GAME_WIDTH, GAME_HEIGHT } from './rendering'
import Layer from './util/layer'
import { createParabola } from './magic'

const DURATION = 50

export default () => new Promise((resolve) => {
  const entity = l1.graphics({
    id:     'fadeInOut',
    width:  GAME_WIDTH,
    height: GAME_HEIGHT,
    zIndex: Layer.FOREGROUND,
  })
  l1.addBehavior(
    entity,
    fadeInOut(DURATION, resolve),
  )
})

const fadeInOut = (duration, resolve) => ({
  endTime: duration,
  data:    {
    hasResolved: false,
    animation:   createParabola({
      start:    0,
      end:      duration,
      offset:   0,
      modifier: 100 / duration,
    }),
  },
  onComplete: ({ entity }) => {
    l1.destroy(entity)
  },
  onUpdate: ({ entity, data, counter }) => {
    const { asset: graphics } = entity
    const alpha = (data.animation(counter) * -1) / 100
    graphics
      .clear()
      .beginFill('black', alpha)
      .moveTo(0, 0)
      .lineTo(GAME_WIDTH, 0)
      .lineTo(GAME_WIDTH, GAME_HEIGHT)
      .lineTo(0, GAME_HEIGHT)
      .lineTo(0, 0)
      .endFill()

    // Resolve after half the duration has passed,
    // to allow the next screen to fade in
    if (!data.hasResolved && (counter >= duration / 2)) {
      data.hasResolved = true
      resolve()
    }
  },
})
