import * as l1 from 'l1'
import * as PIXI from 'pixi.js'

import { HEADER_HEIGHT } from '../header'
import { GAME_WIDTH, GAME_HEIGHT } from '../constant/rendering'
import killPlayer from './killPlayer'
import checkPlayersAlive from './checkPlayersAlive'

export const collisionCheckerWalls = ({
  player, speedMultiplier, wallThickness,
}) => ({
  id:         `collisionCheckerWalls-${player.playerId}`,
  duration:   2,
  loop:       true,
  onComplete: () => {
    const x = player.toGlobal(new PIXI.Point(0, 0)).x / l1.getScale()
    const y = player.toGlobal(new PIXI.Point(0, 0)).y / l1.getScale()
    if (
      x < wallThickness
      || x > GAME_WIDTH - wallThickness - player.hitArea.width
      || y < wallThickness + HEADER_HEIGHT
      || y > GAME_HEIGHT - wallThickness - player.hitArea.height) {
      killPlayer(player, speedMultiplier)
      checkPlayersAlive()
    }
  },
})
