import * as l1 from 'l1'

export const Track = {
  GAME:  './sounds/music/zapper_64kbps.mp3',
  LOBBY: './sounds/music/lobby_music_64kbps.mp3',
}

let soundEntity
let currentTrack

export const playTrack = (track, options = {}) => {
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

  soundEntity = l1.sound(usedOptions)

  currentTrack = track
}
