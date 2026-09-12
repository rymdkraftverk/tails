import type * as PIXI from 'pixi.js'

export default ({
  texture, scaleFactor, radius, pos = { x: 0, y: 0 },
}: {
  texture:     PIXI.Texture
  scaleFactor: number
  radius:      number
  pos?:        { x: number, y: number }
}) => ({
  textures: [texture],
  config:   {
    pos,
    spawnCircle: {
      x: radius / 2,
      y: radius / 2,
      r: radius,
    },
    frequency:       0.02,
    emitterLifetime: 0.2,
    maxParticles:    500,
    lifetime:        {
      min: 0.5 * (1 / scaleFactor),
      max: 1 * (1 / scaleFactor),
    },
    speed: {
      start:             10,
      end:               40,
      minimumMultiplier: 0.5,
    },
    scale: {
      start:             0.1 * (1 / scaleFactor),
      end:               0.1 * (1 / scaleFactor),
      minimumMultiplier: 0.5,
    },
    alpha: {
      start: 1,
      end:   0.1,
    },
    startRotation: {
      min: 180,
      max: 315,
    },
    rotateSprite: true,
  },
})
