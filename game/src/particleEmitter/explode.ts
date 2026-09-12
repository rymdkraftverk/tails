export default ({
  degrees, scaleFactor, radius, x, y,
}: {
  degrees:     number
  scaleFactor: number
  radius:      number
  x:           number
  y:           number
}) => ({
  textures: ['particle-smoke'],
  config:   {
    pos:         { x, y },
    spawnCircle: {
      x: radius / 2,
      y: radius / 2,
      r: radius,
    },
    frequency:       0.01,
    emitterLifetime: 0.1,
    maxParticles:    500,
    lifetime:        {
      min: 0.4 * (1 / scaleFactor),
      max: 1.6 * (1 / scaleFactor),
    },
    speed: {
      start:             150,
      end:               50,
      minimumMultiplier: 0.1,
    },
    scale: {
      start:             2 * (1 / scaleFactor),
      end:               0.6 * (1 / scaleFactor),
      minimumMultiplier: 0.1,
    },
    alpha: {
      start: 1,
      end:   1,
    },
    startRotation: {
      min: (degrees - 180) - 30,
      max: (degrees - 180) + 30,
    },
    rotateSprite: false,
  },
})
