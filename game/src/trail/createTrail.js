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

    const trailE = new PIXI.Container()

    // Find the middle of the player so that
    // we can put the trails' middle point in the same spot
    const x = middle(player, 'x', 'width')
    const y = middle(player, 'y', 'height')

    trailE.x = x - (player.width / 2)
    trailE.y = y - (player.height / 2)
    trailE.active = false
    trailE.player = player.playerId

    l1.add(trailE, {
      parent: l1.get(Scene.GAME),
    })

    const sprite = new PIXI.Sprite(l1.getTexture(`square-game/square-game-${player.color}`))
    sprite.scale.set(scale / speedMultiplier)
    sprite.x = x
    sprite.y = y
    const rotation = l1.toRadians(player.degrees)
    sprite.anchor.set(0.5)
    sprite.rotation = rotation
    sprite.counter = player.trailContainer.counter
    trailE.hitArea = new PIXI.Rectangle(0, 0, sprite.width, sprite.height)

    l1.add(
      sprite,
      {
        parent: player.trailContainer,
      },
    )

    // trailE.x = (((-1 * x) - (trailE.width / 2)) * Math.cos(rotation)) + ((y + (trailE.height / 2)) * Math.sin(rotation)) + (2 * x) + (trailE.width / 2)
    // trailE.y = (((-1 * y) - (trailE.height / 2)) * Math.cos(rotation)) + (((-1 * x) - ((trailE.width / 2))) * Math.sin(rotation)) + (2 * y) + (trailE.height / 2)

    // console.log('trailE.x', trailE.x)
    // console.log('trailE.y', trailE.y)

    // trailE.hitArea = new PIXI.Rectangle(
    //   0,
    //   0,
    //   player.width / 2,
    //   player.height / 2,
    // )

    // l1.addBehavior(l1.displayHitBoxes(trailE, new PIXI.Graphics()))

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
