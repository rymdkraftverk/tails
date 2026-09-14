import { sound } from 'l2/sound'

export const Track = {
  GAME:  './sounds/music/zapper_64kbps.mp3',
  LOBBY: './sounds/music/lobby_music_64kbps.mp3',
}

const current: { entity?: ReturnType<typeof sound>, track?: string } = {}

export const playTrack = (
  track: string,
  options: { forceRestart?: boolean, loop?: boolean, volume?: number } = {},
) => {
  if (current.track === track && !options.forceRestart) return

  const defaultOptions = {
    volume: 0.6,
  }

  const usedOptions = {
    ...defaultOptions,
    ...options,
    src: track,
  }

  current.entity?.stop()
  current.entity = sound(usedOptions)
  current.track = track
}

export const stopTrack = () => {
  current.entity?.stop()
  current.entity = undefined
  current.track = undefined
}
