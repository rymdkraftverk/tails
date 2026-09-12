import * as l1 from '../l1'
import * as PIXI from 'pixi.js'
import { emit } from '../particles'
import { SPEED_MULTIPLIER } from '../game'
import Layer from '../constant/layer'
import sparks from '../particleEmitter/sparks'
import { HEADER_HEIGHT } from '../header'
import Scene from '../Scene'
import { GAME_WIDTH, GAME_HEIGHT } from '../constant/rendering'

let sparkleParticleContainer: PIXI.Container | undefined
export default (id: string, { x, y }: { x: number, y: number }) => {
  const player = l1.get(id)

  // Create the Container if it hasn't been created before or has been destroyed previous round
  if (!sparkleParticleContainer
        || (sparkleParticleContainer.l1 && sparkleParticleContainer.l1.isDestroyed())) {
    sparkleParticleContainer = new PIXI.Container()
    l1.add(sparkleParticleContainer, {
      parent: l1.get(Scene.GAME),
      labels: ['particleContainer'],
      zIndex: Layer.FOREGROUND + 10,
    })
  }

  // This is needed since events might be sent during score screen when player does not exist
  if (!player || (sparkleParticleContainer.l1 && sparkleParticleContainer.l1.isDestroyed())) {
    return
  }

  const {
    textures: neonTextures,
    config: neonConfig,
  } = sparks({
    texture:     player.sprite.texture,
    scaleFactor: (SPEED_MULTIPLIER / player.scaleFactor) / 2,
    radius:      player.width * 2,
    pos:         {
      x: x * GAME_WIDTH,
      y: HEADER_HEIGHT + (y * (GAME_HEIGHT - HEADER_HEIGHT)),
    },
  })

  emit({
    parent:   sparkleParticleContainer,
    textures: neonTextures,
    ...neonConfig,
  })
}
