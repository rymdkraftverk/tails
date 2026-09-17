import type { Behavior } from 'l2'
import type * as PIXI from 'pixi.js'

import { TURN_RADIUS } from '../game'

export default (player: PIXI.Container) => ({
  id:       `bot-${player.id}`,
  onUpdate: ({ counter }: Behavior) => {
    // inverse relationship with square root is chosen with mathematical precision.
    // factor is chosen by trial and error.
    // + 1 is to avoid divide by zero
    const factor = 12.3 / Math.sqrt(counter + 1)
    player.degrees += (TURN_RADIUS * factor)
  },
})
