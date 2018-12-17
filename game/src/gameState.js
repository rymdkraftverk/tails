import R from 'ramda'
import { EventEmitter } from 'eventemitter3'
import { Color } from 'common'

export const CurrentState = {
  LOBBY:          'lobby',
  SCORE_OVERVIEW: 'score-overview',
  PLAYING_ROUND:  'playing-round',
}

const gameState = {
  currentState:    CurrentState.LOBBY,
  gameCode:        '',
  players:         [],
  lastRoundResult: {
    winner: null,
  },
  events:          new EventEmitter(),
  availableColors: Object.keys(Color),
}

export const getPlayer = id => R.find(R.propEq('playerId', id), gameState.players)

export default gameState
