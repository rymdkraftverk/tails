import R from 'ramda'
import * as l1 from 'l1'
import * as PIXI from 'pixi.js'
import { Emitter } from 'pixi-particles'

import GameEvent from '../constant/gameEvent'
import explode from '../particleEmitter/explode'
import Scene from '../Scene'
import Layer from '../constant/layer'
import Sound from '../constant/sound'
import Trail from '../constant/trail'
import { state } from '../state'
import sparks from '../particleEmitter/sparks'

const killPlayer = (player, speedMultiplier) => {
  const {
    textures,
    config,
  } = explode({
    degrees:     player.degrees,
    scaleFactor: (speedMultiplier / player.scaleFactor),
    radius:      player.width,
    x:           l1.getGlobalPosition(player).x,
    y:           l1.getGlobalPosition(player).y,
  })

  const particleContainer = new PIXI.Container()
  l1.add(
    particleContainer,
    {
      parent: l1.get(Scene.GAME),
      zIndex: Layer.FOREGROUND + 1,
      labels: ['particleContainer'],
    },
  )
  new Emitter(
    particleContainer,
    textures.map(l1.getTexture),
    config,
  )
    .playOnceAndDestroy()

  l1.sound({
    src:    Sound.DEATH,
    volume: 0.6,
  })

  player.alive = false

  const behaviorsToRemove = [
    `collisionCheckerTrail-${player.id}`,
    `collisionCheckerWalls-${player.id}`,
    `createHoleMaker-${player.id}`,
    `holeMaker-${player.id}`,
    `createTrail-${player.id}`,
    `move-${player.id}`,
    `pivot-${player.id}`,
  ]

  R.forEach(
    l1.removeBehavior,
    behaviorsToRemove,
  )

  state.eventEmitter.emit(GameEvent.PLAYER_COLLISION, player.color)
  player.event.emit(GameEvent.PLAYER_COLLISION)

  const {
    textures: neonTextures,
    config: neonConfig,
  } = sparks({
    texture:     player.texture,
    scaleFactor: (speedMultiplier / player.scaleFactor),
    radius:      player.width,
  })

  player.texture = l1.getTexture(`circle-dark/circle-${player.color}-dark`)

  const neonDeath = l1.addBehavior({
    data: {
      index: player.trailContainer.children.length - 1,
    },
    onInit: ({ data }) => {
      data.initialCounter = player.trailContainer.children[data.index].counter
    },
    onUpdate: ({ data, counter }) => {
      if (data.index < 0) {
        l1.removeBehavior(neonDeath)
        return
      }
      let trail = player.trailContainer.children[data.index]

      // eslint-disable-next-line fp/no-loops
      while (
        data.index >= 0
        && (data.initialCounter - (counter * Trail.CREATE_TRAIL_FREQUENCY * Trail.NEON_DEATH_SPEED))
        <= trail.counter
      ) {
        const neonDeathParticleContainer = new PIXI.Container()
        neonDeathParticleContainer.position = trail.position
        l1.add(neonDeathParticleContainer, {
          parent: l1.get(Scene.GAME),
          labels: ['particleContainer'],
        })
        new Emitter(
          neonDeathParticleContainer,
          neonTextures,
          neonConfig,
        )
          .playOnceAndDestroy()
        trail.sprite.texture = l1.getTexture(`square-dark/square-${player.color}-dark`)
        data.index -= 1
        trail = player.trailContainer.children[data.index]
      }
    },
  })
}

export default killPlayer
