import R from 'ramda'
import { state } from '../state'

// -- Private ---

// eslint-disable-next-line fp/no-rest-parameters
const deferStateApplication = f => (...args) => f(state, ...args)

const scoreBoard = R.reduce(
  (a, b) => ({ ...a, [b.color]: b.score }),
  {},
)

// --- Public ---
// All functions below MUST take the state object as
// their first argument. It will automatically get injected
// into the exported functions thanks to `deferStateApplication`

const identifiableScoreBoard = ({ players, gameCode }) => ({
  code:       gameCode,
  scoreBoard: scoreBoard(players),
})

export default R.map(deferStateApplication, {
  identifiableScoreBoard,
})
