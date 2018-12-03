export default ({ x, y, color }) => {
  const textures = [`square/square-${color}`]
  const config = {
    alpha: {
      start: 1,
      end:   1,
    },
    scale: {
      start:                  0.5,
      end:                    0.025,
      minimumScaleMultiplier: 0.1,
    },
    speed: {
      start:                  120,
      end:                    40,
      minimumSpeedMultiplier: 0.1,
    },
    acceleration: {
      x: 0,
      y: 0,
    },
    maxSpeed:      0,
    startRotation: {
      min: 0,
      max: 360,
    },
    noRotation:    false,
    rotationSpeed: {
      min: 0,
      max: 0,
    },
    lifetime: {
      min: 0.4,
      max: 1.6,
    },
    pos: {
      x,
      y,
    },
    blendMode:       'normal',
    frequency:       0.003,
    emitterLifetime: 0.3,
    maxParticles:    3000,
    emit:            true,
    autoUpdate:      true,
    addAtBack:       false,
    spawnType:       'point',
  }

  return {
    textures,
    config,
  }
}
