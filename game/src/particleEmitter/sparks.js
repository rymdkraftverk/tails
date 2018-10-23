
export default (texture) => {
  const textures = [texture]

  const config = {
    // alpha: {
    //   start: 1,
    //   end:   1,
    // },
    scale: {
      start:                  0.05,
      end:                    0.05,
      minimumScaleMultiplier: 0.5,
    },
    // speed: {
    //   start:                  50,
    //   end:                    50,
    //   minimumSpeedMultiplier: 0.5,
    // },
    acceleration: {
      x: 100,
      y: 100,
    },
    maxSpeed:      500,
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
      min: 0.2,
      max: 0.8,
    },
    blendMode:    'normal',
    frequency:    0.004,
    maxParticles: 500,
    pos:          {
      x: 0,
      y: 0,
    },
    addAtBack:   false,
    spawnType:   'circle',
    spawnCircle: {
      x: 0,
      y: 0,
      r: 15,
    },
    emit:       true,
    autoUpdate: true,
  }

  return {
    textures,
    config,
  }
}
