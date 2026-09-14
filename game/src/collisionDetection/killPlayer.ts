import { sound } from 'l2/sound'
import * as l2 from 'l2'
import * as PIXI from 'pixi.js'
import { emit } from '../particles'

import GameEvent from '../constant/gameEvent'
import explode from '../particleEmitter/explode'
import Scene from '../Scene'
import Layer from '../constant/layer'
import Sound from '../constant/sound'
import Trail from '../constant/trail'
import { state } from '../state'
import sparks from '../particleEmitter/sparks'

const killPlayer = (player: PIXI.Container, speedMultiplier: number) => {
  const {
    textures,
    config,
  } = explode({
    degrees:     player.degrees,
    scaleFactor: (speedMultiplier / player.scaleFactor),
    radius:      player.width,
    x:           l2.getGlobalPosition(player).x,
    y:           l2.getGlobalPosition(player).y,
  })

  const particleContainer = new PIXI.Container()
  l2.add(
    particleContainer,
    {
      parent: l2.get(Scene.GAME),
      zIndex: Layer.FOREGROUND + 1,
      labels: ['particleContainer'],
    },
  )
  emit({
    parent:   particleContainer,
    textures: textures.map(l2.getTexture),
    ...config,
  })

  sound({
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

  behaviorsToRemove.forEach(id => l2.removeBehavior(id))

  state.eventEmitter.emit(GameEvent.PLAYER_COLLISION, player.color)
  player.event.emit(GameEvent.PLAYER_COLLISION)

  const {
    textures: neonTextures,
    config: neonConfig,
  } = sparks({
    texture:     player.sprite.texture,
    scaleFactor: (speedMultiplier / player.scaleFactor),
    radius:      player.width,
  })

  player.sprite.texture = l2.getTexture(`circle-dark/circle-${player.color}-dark`)

  const neonDeath = l2.addBehavior({
    data: {
      index:          player.trailContainer.children.length - 1,
      initialCounter: 0,
    },
    onInit: ({ data }) => {
      data.initialCounter = player.trailContainer.children[data.index].counter
    },
    onUpdate: ({ data, counter }) => {
      if (data.index < 0) {
        l2.removeBehavior(neonDeath)
        return
      }
      const trailAt = () => player.trailContainer.children[data.index]

      while (
        data.index >= 0
        && (data.initialCounter - (counter * Trail.CREATE_TRAIL_FREQUENCY * Trail.NEON_DEATH_SPEED))
        <= trailAt().counter
      ) {
        const trail = trailAt()
        const neonDeathParticleContainer = new PIXI.Container()
        neonDeathParticleContainer.position = trail.position
        l2.add(neonDeathParticleContainer, {
          parent: l2.get(Scene.GAME),
          labels: ['particleContainer'],
        })
        emit({
          parent:   neonDeathParticleContainer,
          textures: neonTextures,
          ...neonConfig,
        })
        trail.sprite.texture = l2.getTexture(`square-dark/square-${player.color}-dark`)
        data.index -= 1
      }
    },
  })
}

export default killPlayer
