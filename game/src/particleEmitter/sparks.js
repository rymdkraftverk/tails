export default ({
  texture, scaleFactor, radius, pos = { x: 0, y: 0 },
}) => {
  const textures = [texture]

  const config = {
    alpha: {
      start: 1,
      end:   0.1,
    },
    scale: {
      start:                  0.1 * (1 / scaleFactor),
      end:                    0.1 * (1 / scaleFactor),
      minimumScaleMultiplier: 0.5,
    },
    speed: {
      start:                  10,
      end:                    40,
      minimumSpeedMultiplier: 0.5,
    },
    startRotation: {
      min: 180,
      max: 315,
    },
    noRotation:    false,
    rotationSpeed: {
      min: 0,
      max: 0,
    },
    lifetime: {
      min: 0.5 * (1 / scaleFactor),
      max: 1 * (1 / scaleFactor),
    },
    blendMode:    'normal',
    frequency:    0.02,
    maxParticles: 500,
    pos,
    addAtBack:    false,
    spawnType:    'circle',
    spawnCircle:  {
      x: radius / 2,
      y: radius / 2,
      r: radius,
    },
    emitterLifetime: 0.2,
    autoUpdate:      true,
  }

  return {
    textures,
    config,
  }
}
