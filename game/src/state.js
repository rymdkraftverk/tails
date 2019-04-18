import { EventEmitter } from 'eventemitter3'
import { Color } from 'common'

// TODO: Should probably lie elsewhere
export const State = {
  LOBBY:          'lobby',
  SCORE_OVERVIEW: 'score-overview',
  PLAYING_ROUND:  'playing-round',
}

export const state = {
  state:           State.LOBBY,
  gameCode:        '',
  kdTree:          null,
  lastRoundResult: {
    winner: null,
  },
  eventEmitter:    new EventEmitter(),
  availableColors: Object.keys(Color),
  players:         [],
  portalPairs:     0,
}
