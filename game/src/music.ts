import { sound } from 'l2/sound'

export const Track = {
  GAME:  './sounds/music/zapper_64kbps.mp3',
  LOBBY: './sounds/music/lobby_music_64kbps.mp3',
}

let soundEntity: ReturnType<typeof sound> | undefined
let currentTrack: string | undefined

export const playTrack = (
  track: string,
  options: { forceRestart?: boolean, loop?: boolean, volume?: number } = {},
) => {
  if (currentTrack === track && !options.forceRestart) return

  const defaultOptions = {
    volume: 0.6,
  }

  const usedOptions = {
    ...defaultOptions,
    ...options,
    src: track,
  }

  if (soundEntity) {
    soundEntity.stop()
  }

  soundEntity = sound(usedOptions)

  currentTrack = track
}

export const stopTrack = () => {
  if (soundEntity) {
    soundEntity.stop()
  }

  soundEntity = undefined
  currentTrack = undefined
}
