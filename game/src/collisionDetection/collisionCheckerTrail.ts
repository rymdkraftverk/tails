import * as l1 from '../l1'
import type * as PIXI from 'pixi.js'
import { nearestNeighbour, type Tree } from '../kdTree'

import { state } from '../state'
import checkPlayersAlive from './checkPlayersAlive'
import killPlayer from './killPlayer'

export const collisionCheckerTrail = (player: PIXI.Sprite, speedMultiplier: number) => ({
  id:         `collisionCheckerTrail-${player.id}`,
  duration:   2,
  loop:       true,
  onComplete: () => {
    const isColliding = (other: PIXI.Container) => l1.isColliding(player, other)

    const options = {
      earlyReturn: isColliding,
      filter:      (t: PIXI.Container) => t.active || t.player !== player.id,
      getCoord:    (e: PIXI.Container, dimension: string) => (dimension === 'x' ? e.x : e.y),
    }

    const closestOrFirstCollidingEntity = nearestNeighbour(
      options,
      state.kdTree as Tree<PIXI.Container>,
      player,
    )

    if (closestOrFirstCollidingEntity && isColliding(closestOrFirstCollidingEntity)) {
      killPlayer(player, speedMultiplier)
      checkPlayersAlive()
    }
  },
})
