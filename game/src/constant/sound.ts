import { effect, track } from 'l2/sound'

const soundPath = (fileName: string) => `./sounds/${fileName}.wav`

const musicPath = (fileName: string) => `./sounds/music/${fileName}.mp3`

export const Track = {
  GAME:      track({ src: musicPath('zapper_64kbps'), volume: 0.6 }),
  LOBBY:     track({ src: musicPath('lobby_music_64kbps'), volume: 0.6 }),
  FIREWORKS: track({ src: soundPath('firework'), volume: 0.5 }),
}

export default {
  COUNTDOWN:       effect({ src: soundPath('countdown'), volume: 0.1 }),
  COUNTDOWN_END:   effect({ src: soundPath('countdown_end'), volume: 0.1 }),
  DEATH:           effect({ src: soundPath('death'), volume: 0.6 }),
  JOIN1:           effect({ src: soundPath('join1'), volume: 0.4 }),
  JOIN2:           effect({ src: soundPath('join2'), volume: 0.4 }),
  JOIN3:           effect({ src: soundPath('join3'), volume: 0.4 }),
  POWERUP_PICKUP:  effect({ src: soundPath('join1'), volume: 0.6 }),
  POWERUP_EXPIRED: effect({ src: soundPath('powerup-expired'), volume: 0.6 }),
}
