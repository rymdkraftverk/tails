export default ({
  degrees, scaleFactor, radius, x, y,
}) => {
  const textures = ['particle-smoke']
  const config = {
    alpha: {
      start: 1,
      end:   1,
    },
    speed: {
      start:                  150,
      end:                    50,
      minimumSpeedMultiplier: 0.1,
    },
    acceleration: {
      x: 0,
      y: 0,
    },
    maxSpeed:        0,
    noRotation:      true,
    blendMode:       'normal',
    frequency:       0.01,
    emitterLifetime: 0.2,
    maxParticles:    500,
    addAtBack:       false,
    spawnType:       'circle',
    startRotation:   {
      min: (degrees - 180) - 30,
      max: (degrees - 180) + 30,
    },
    scale: {
      start:                  1 * (1 / scaleFactor),
      end:                    0.3 * (1 / scaleFactor),
      minimumScaleMultiplier: 0.1,
    },
    pos: {
      x,
      y,
    },
    lifetime: {
      min: 0.2 * (1 / scaleFactor),
      max: 0.8 * (1 / scaleFactor),
    },
    spawnCircle: {
      x: radius / 2,
      y: radius / 2,
      r: radius,
    },
  }

  return {
    config,
    textures,
  }
}
