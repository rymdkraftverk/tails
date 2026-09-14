import * as l2 from 'l2'
import * as PIXI from 'pixi.js'
import { emit } from '../particles'
import { SPEED_MULTIPLIER } from '../game'
import Layer from '../constant/layer'
import sparks from '../particleEmitter/sparks'
import { HEADER_HEIGHT } from '../header'
import Scene from '../Scene'
import { GAME_WIDTH, GAME_HEIGHT } from '../constant/rendering'

const SPARKLES = 'sparkleParticleContainer'

const createSparkles = () => {
  const container = new PIXI.Container()
  l2.add(container, {
    id:     SPARKLES,
    parent: l2.get(Scene.GAME),
    labels: ['particleContainer'],
    zIndex: Layer.FOREGROUND + 10,
  })
  return container
}

export default (id: string, { x, y }: { x: number, y: number }) => {
  const player = l2.get(id)

  // This is needed since events might be sent during score screen when player does not exist
  if (!player) {
    return
  }

  // Create the Container if it hasn't been created before or has been destroyed previous round
  const existing = l2.get(SPARKLES)
  const sparkleParticleContainer = existing && !l2.isDestroyed(existing)
    ? existing
    : createSparkles()

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
