import R from 'ramda'
import { state } from '../state'

// -- Private ---

const scoreBoard = R.reduce(
  (a, b) => ({ ...a, [b.color]: b.score }),
  {},
)

// --- Public ---

const identifiableScoreBoard = ({ players, gameCode }) => ({
  code:       gameCode,
  scoreBoard: scoreBoard(players),
})

// eslint-disable-next-line fp/no-rest-parameters
const deferStateApplication = f => (...args) => f(state, ...args)

export default R.map(deferStateApplication, {
  identifiableScoreBoard,
})
