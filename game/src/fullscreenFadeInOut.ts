import * as l1 from './l1'
import type { Behavior } from './l1'
import * as PIXI from 'pixi.js'
import { GAME_WIDTH, GAME_HEIGHT } from './constant/rendering'
import Layer from './constant/layer'
import { createParabola } from './magic'

const DURATION = 50

export default () => new Promise<void>((resolve) => {
  const fade = new PIXI.Graphics()
  l1.add(
    fade,
    {
      id:     'fadeInOut',
      zIndex: Layer.FOREGROUND + 10,
    },
  )

  l1.addBehavior(fadeInOut(fade, DURATION, resolve))
})

type FadeData = {
  hasResolved: boolean
  animation:   (t: number) => number
}

const fadeInOut = (graphics: PIXI.Graphics, duration: number, resolve: () => void) => ({
  duration,
  data: {
    hasResolved: false,
    animation:   createParabola({
      start:    0,
      end:      duration,
      offset:   0,
      modifier: 100 / duration,
    }),
  },
  onComplete: () => {
    l1.destroy(graphics)
  },
  onUpdate: ({ data, counter }: Behavior<FadeData>) => {
    const alpha = (data.animation(counter) * -1) / 100
    graphics
      .clear()
      .moveTo(0, 0)
      .lineTo(GAME_WIDTH, 0)
      .lineTo(GAME_WIDTH, GAME_HEIGHT)
      .lineTo(0, GAME_HEIGHT)
      .lineTo(0, 0)
      .fill({ color: 0x000000, alpha })

    // Resolve after half the duration has passed,
    // to allow the next screen to fade in
    if (!data.hasResolved && (counter >= duration / 2)) {
      data.hasResolved = true
      resolve()
    }
  },
})
