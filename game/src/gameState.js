import { EventEmitter } from 'eventemitter3'
import { Color } from 'common'

export const CurrentState = {
  LOBBY:          'lobby',
  SCORE_OVERVIEW: 'score-overview',
  PLAYING_ROUND:  'playing-round',
}

const gameState = {
  currentState:                   CurrentState.LOBBY,
  gameCode:                       '',
  // TODO: change to array
  players: {
  },
  lastRoundResult: {
    playerFinishOrder: [],
    winner:            null,
  },
  events:          new EventEmitter(),
  availableColors: Object.keys(Color),
}

export default gameState
