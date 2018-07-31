import { Entity, Graphics } from 'l1'
import { GAME_WIDTH, GAME_HEIGHT } from '.'
import layers from './util/layers'
import { createParabola } from './magic'

const DURATION = 50

export default () => new Promise((resolve) => {
  const entity = Entity.addChild(
    Entity.getRoot(),
    {
      id:     'fadeInOut',
      width:  GAME_WIDTH,
      height: GAME_HEIGHT,
    },
  )
  Graphics.create(entity, { zIndex: layers.FOREGROUND })
  entity.behaviors.fadeInOut = fadeInOut(DURATION, resolve)
})

const fadeInOut = (duration, resolve) => ({
  hasResolved: false,
  tick:        0,
  animation:   createParabola({
    start:    0,
    end:      duration,
    offset:   0,
    modifier: 100 / duration,
  }),
  run: (b, e) => {
    const { asset: graphics } = e
    const alpha = (b.animation(b.tick) * -1) / 100
    b.tick += 1
    graphics.clear()
    graphics.beginFill('black', alpha)
    graphics.moveTo(0, 0)
    graphics.lineTo(GAME_WIDTH, 0)
    graphics.lineTo(GAME_WIDTH, GAME_HEIGHT)
    graphics.lineTo(0, GAME_HEIGHT)
    graphics.lineTo(0, 0)
    graphics.endFill()
    // console.log('alpha', alpha)
    if (!b.hasResolved && (b.tick >= duration / 2)) {
      b.hasResolved = true
      resolve()
    }
    if (b.tick >= DURATION) {
      // eslint-disable-next-line fp/no-delete
      Entity.destroy(e)
    }
  },
})
