import R from 'ramda'
import { state } from './state'

// -- Private ---

const subtract = R.flip(R.subtract)

const getHighestScore = R.pipe(
  R.sortBy(R.prop('score')),
  R.last,
  R.prop('score'),
)

const write = (x) => {
  state.players = x
}

// --- Public ---
// --- Read ---

const find = R.curry((players, id) => R.find(R.propEq('id', id), players))

const getWithHighestScores = players => R.pipe(
  getHighestScore,
  score => R.filter(R.propEq('score', score), players),
)(players)

const isFirstPlace = R.curry((players, id) => R.pipe(
  getWithHighestScores,
  R.reject(R.propEq('score', 0)),
  R.any(R.propEq('id', id)),
)(players))

const scoreToWin = R.pipe(
  R.length,
  subtract(1),
  R.multiply(3),
)

// --- Write ---

const resetScores = R.pipe(
  R.map(x => ({ ...x, score: 0, previousScore: 0 })),
  R.tap(write),
)

// eslint-disable-next-line fp/no-rest-parameters
const deferStateApplication = f => (...args) => f(state.players, ...args)

export default R.map(deferStateApplication, {
  find,
  getWithHighestScores,
  isFirstPlace,
  resetScores,
  scoreToWin,
})
