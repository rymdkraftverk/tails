import { createSine } from '../magic'

const indicateExpiration = (player, speed, duration) => ({
  id:   `indicateExpiration-${player.playerId}`,
  duration,
  data: {
    sine: createSine({
      start: 0.2,
      end:   0.8,
      speed,
    }),
  },
  onRemove: () => {
    player.alpha = 1
  },
  onUpdate: ({ counter, data }) => {
    player.alpha = data.sine(counter)
  },
})

export default indicateExpiration

