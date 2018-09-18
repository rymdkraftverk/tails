import { Entity, Sound } from 'l1'

export const Track = {
  GAME:  './sounds/music/zapper_64kbps.mp3',
  LOBBY: './sounds/music/lobby_music_64kbps.mp3',
}

const soundEntity = Entity.addChild(Entity.getRoot())
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

  Sound.stop(soundEntity)
  Sound.play(soundEntity, usedOptions)

  currentTrack = track
}
