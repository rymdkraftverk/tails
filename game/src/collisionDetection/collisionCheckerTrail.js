import * as l1 from 'l1'
import R from 'ramda'

import gameState from '../gameState'
import { nearestNeighbour } from '../kd-tree'
import checkPlayersAlive from './checkPlayersAlive'
import killPlayer from './killPlayer'

export const collisionCheckerTrail = (player, speedMultiplier) => ({
  id:         `collisionCheckerTrail-${player.id}`,
  duration:   2,
  loop:       true,
  onComplete: () => {
    const isColliding = R.curry(l1.isColliding)(player)

    const options = {
      earlyReturn: isColliding,
      filter:      t => t.active || t.player !== player.id,
      getCoord:    (e, dimension) => e[dimension],
    }

    const closestOrFirstCollidingEntity = nearestNeighbour(options, gameState.kdTree, player)

    if (closestOrFirstCollidingEntity && isColliding(closestOrFirstCollidingEntity)) {
      killPlayer(player, speedMultiplier)
      checkPlayersAlive()
    }
  },
})
