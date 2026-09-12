export default ({ x, y, color }: { x: number, y: number, color: string }) => ({
  textures: [`square/square-${color}`],
  config:   {
    pos:             { x, y },
    frequency:       0.003,
    emitterLifetime: 0.3,
    maxParticles:    3000,
    lifetime:        {
      min: 0.4,
      max: 1.6,
    },
    speed: {
      start:             120,
      end:               40,
      minimumMultiplier: 0.1,
    },
    scale: {
      start:             0.5,
      end:               0.025,
      minimumMultiplier: 0.1,
    },
    alpha: {
      start: 1,
      end:   1,
    },
    startRotation: {
      min: 0,
      max: 360,
    },
    rotateSprite: true,
  },
})
