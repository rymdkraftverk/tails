import R from 'ramda'
import { state } from '../state'

// -- Private ---

// eslint-disable-next-line fp/no-rest-parameters
const deferStateApplication = f => (...args) => f(state.players, ...args)

const subtract = R.flip(R.subtract)
const includes = R.flip(R.contains)

const getHighestScore = R.pipe(
  R.sortBy(R.prop('score')),
  R.last,
  R.prop('score'),
)

const isReady = R.propEq('ready', true)

const incScore = R.over(
  R.lensProp('score'),
  R.inc,
)

const write = (x) => {
  state.players = x
}

// --- Public ---
// All functions below MUST take a list of players as
// their first argument. It will automatically get injected
// into the exported functions thanks to `deferStateApplication`

// --- Read ---

const allReady = R.all(isReady)

const count = R.length

const countFactor = R.pipe(
  count,
  Math.sqrt,
)

const find = R.curry((players, id) => R.find(R.propEq('id', id), players))

const getReadyCount = R.pipe(
  R.filter(isReady),
  count,
)

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
const add = R.curry((players, player) => R.pipe(
  R.concat([player]),
  R.tap(write),
)(players))

const incScores = R.curry((players, whitelist) => R.pipe(
  R.map(R.when(
    R.pipe(
      R.prop('id'),
      includes(whitelist),
    ),
    incScore,
  )),
  R.tap(write),
)(players))

const remove = R.curry((players, id) => R.pipe(
  R.reject(R.propEq('id', id)),
  R.tap(write),
)(players))

const resetReady = R.pipe(
  R.map(R.assoc('ready', false)),
  R.tap(write),
)

const resetScores = R.pipe(
  R.map(x => ({ ...x, score: 0, previousScore: 0 })),
  R.tap(write),
)

export default R.map(deferStateApplication, {
  add,
  allReady,
  count,
  countFactor,
  find,
  getReadyCount,
  getWithHighestScores,
  incScores,
  isFirstPlace,
  remove,
  resetReady,
  resetScores,
  scoreToWin,
})
