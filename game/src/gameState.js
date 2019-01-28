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

export const isFirstPlace = id => getPlayersWithHighestScore(gameState.players)
  .filter(p => p.score !== 0)
  .some(({ playerId }) => playerId === id)

export const getPlayersWithHighestScore = () => R.compose(
  score => gameState.players
    .filter(p => p.score === score),
  R.reduce(R.max, 0),
  R.map(parseInt),
  Object.keys,
  R.groupBy(R.prop('score')),
)(gameState.players)

export const scoreToWin = () => (Object.keys(gameState.players).length - 1) * 4

export const resetPlayersScore = () => {
  gameState.players = R.map(x => ({ ...x, score: 0, previousScore: 0 }))(gameState.players)
}

export default gameState
