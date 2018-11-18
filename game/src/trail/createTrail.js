import * as l1 from 'l1'
import * as PIXI from 'pixi.js'

import Scene from '../Scene'
import gameState from '../gameState'
import { addEntityToTree } from '../kd-tree'
import Trail from '../constant/trail'

export const createTrail = ({
  player, scale, speedMultiplier, duration,
}) => ({
  id:       `createTrail-${player.playerId}`,
  duration: duration || Trail.CREATE_TRAIL_FREQUENCY,
  loop:     true,
  onInit:   () => {
    if (!player.trailContainer) {
      // This container is used to group all trails into one parent
      // It is used for the "lights out" death animation
      player.trailContainer = new PIXI.Container()
      l1.add(player.trailContainer, {
        parent: l1.get(Scene.GAME),
      })
      player.trailContainer.counter = 0
    }
  },
  onComplete: () => {
    player.trailContainer.counter += Trail.CREATE_TRAIL_FREQUENCY
    if (player.preventTrail > 0) {
      return
    }

    const trailE = new PIXI.Sprite(l1.getTexture(`circle-${player.color}`))
    l1.add(
      trailE,
      {
        parent: player.trailContainer,
        labels: ['trail'],
      },
    )

    trailE.active = false
    trailE.player = player.playerId
    trailE.counter = player.trailContainer.counter

    trailE.scale.set(scale / speedMultiplier / 2)

    // Find the middle of the player so that
    // we can put the trails' middle point in the same spot
    trailE.x = middle(player, 'x', 'width') - (trailE.width / 2)
    trailE.y = middle(player, 'y', 'height') - (trailE.height / 2)

    l1.addBehavior(activate(trailE))

    const options = {
      getCoord: (e, dim) => e[dim],
    }
    gameState.kdTree = addEntityToTree(options, gameState.kdTree, trailE)
  },
})

const middle = (displayObject, dim, prop) =>
  (displayObject.toGlobal(new PIXI.Point(0, 0))[dim] / l1.getScale()) +
  (displayObject.hitArea[prop] / 2)

/*
 * This behavior is needed so that the player wont immediately collide with its own tail.
 */
const activate = trail => ({
  duration:   15,
  onComplete: () => {
    trail.active = true
  },
})

