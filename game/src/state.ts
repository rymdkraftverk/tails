import { EventEmitter } from 'eventemitter3'
import { Color } from 'common'
import type { initEmptyTree } from './kdTree'

// TODO: Should probably lie elsewhere
export const State = {
  LOBBY:          'lobby',
  SCORE_OVERVIEW: 'score-overview',
  PLAYING_ROUND:  'playing-round',
} as const

export const state = {
  state:           State.LOBBY as (typeof State)[keyof typeof State],
  gameCode:        '',
  kdTree:          null as ReturnType<typeof initEmptyTree> | null,
  lastRoundResult: {
    winner: null as unknown as keyof typeof Color,
  },
  eventEmitter:    new EventEmitter(),
  availableColors: Object.keys(Color) as (keyof typeof Color)[],
  players:         [] as Player[],
  portalPairs:     0,
}
