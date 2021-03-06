import * as l1 from 'l1'
import * as PIXI from 'pixi.js'
import { addEntityToTree } from 'bounded-kd-tree'

import Scene from '../Scene'
import { state } from '../state'
import Trail from '../constant/trail'
import Layer from '../constant/layer'

export const createTrail = ({
  player, scale, speedMultiplier, duration,
}) => ({
  id:       `createTrail-${player.id}`,
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
    if (!player.trailSpriteContainer) {
      // This container is used to group all trail sprites into one parent
      // So that zIndex will only be set once, since it's an expensive sort operation
      player.trailSpriteContainer = new PIXI.Container()
      l1.add(player.trailSpriteContainer, {
        parent: l1.get(Scene.GAME),
        zIndex: Layer.CENTER,
      })
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
    trailE.player = player.id

    l1.add(trailE, {
      parent: player.trailContainer,
    })

    const sprite = new PIXI.Sprite(l1.getTexture(`square-game/square-game-${player.color}`))
    sprite.scale.set(scale / speedMultiplier)
    sprite.x = x
    sprite.y = y
    const rotation = l1.toRadians(player.degrees)
    sprite.anchor.set(0.5)
    sprite.rotation = rotation

    trailE.counter = player.trailContainer.counter
    trailE.sprite = sprite
    trailE.hitArea = new PIXI.Rectangle(0, 0, sprite.width, sprite.height)

    l1.add(
      sprite,
      {
        parent: player.trailSpriteContainer,
      },
    )

    l1.addBehavior(activate(trailE))

    const options = {
      getCoord: (e, dim) => e[dim],
    }
    state.kdTree = addEntityToTree(options, state.kdTree, trailE)
  },
})

const middle = (
  displayObject,
  dim,
  prop,
) => (displayObject.toGlobal(new PIXI.Point(0, 0))[dim] / l1.getScale())
  + (displayObject.hitArea[prop] / 2)

/*
 * This behavior is needed so that the player wont immediately collide with its own tail.
 */
const activate = trail => ({
  // Arbitrary duration, has to be long enough so the player can't turn around and hit itself
  duration:   90,
  onComplete: () => {
    trail.active = true
  },
})
