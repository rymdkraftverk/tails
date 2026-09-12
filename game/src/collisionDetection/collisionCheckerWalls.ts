import * as l1 from '../l1'
import * as PIXI from 'pixi.js'

import { HEADER_HEIGHT } from '../header'
import { GAME_WIDTH, GAME_HEIGHT } from '../constant/rendering'
import killPlayer from './killPlayer'
import checkPlayersAlive from './checkPlayersAlive'

export const collisionCheckerWalls = ({
  player, speedMultiplier, wallThickness,
}: {
  player:          PIXI.Container
  speedMultiplier: number
  wallThickness:   number
}) => ({
  id:         `collisionCheckerWalls-${player.id}`,
  duration:   2,
  loop:       true,
  onComplete: () => {
    const x = player.toGlobal(new PIXI.Point(0, 0)).x / l1.getScale()
    const y = player.toGlobal(new PIXI.Point(0, 0)).y / l1.getScale()
    const hitArea = player.hitArea as PIXI.Rectangle
    if (
      x < wallThickness
      || x > GAME_WIDTH - wallThickness - hitArea.width
      || y < wallThickness + HEADER_HEIGHT
      || y > GAME_HEIGHT - wallThickness - hitArea.height) {
      killPlayer(player, speedMultiplier)
      checkPlayersAlive()
    }
  },
})
