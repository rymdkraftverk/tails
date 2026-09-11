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
  /** @type {ReturnType<typeof import('./kdTree').initEmptyTree> | null} */
  kdTree:          null,
  lastRoundResult: {
    winner: /** @type {keyof typeof Color} */ (/** @type {*} */ (null)),
  },
  eventEmitter:    new EventEmitter(),
  availableColors: Object.keys(Color),
  /** @type {Player[]} */
  players:         [],
  portalPairs:     0,
}
