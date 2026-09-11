import { state } from '../state'

const write = (players: Player[]) => {
  state.players = players
}

const isReady = ({ ready }: Player) => ready === true

const getHighestScore = (players: Player[]) => players
  .reduce((highest, { score }) => Math.max(highest, score), 0)

// --- Read ---

const allReady = () => state.players.every(isReady)

const count = () => state.players.length

const countFactor = () => Math.sqrt(count())

const find = (id: string) => {
  const player = state.players.find(p => p.id === id)
  if (!player) {
    throw new Error(`No player with id ${id}`)
  }
  return player
}

const getReadyCount = () => state.players.filter(isReady).length

const getWithHighestScores = () => {
  const highest = getHighestScore(state.players)
  return state.players.filter(({ score }) => score === highest)
}

const isFirstPlace = (id: string) => getWithHighestScores()
  .filter(({ score }) => score !== 0)
  .some(player => player.id === id)

const scoreToWin = () => (count() - 1) * 3

// --- Write ---

const add = (player: Player) => {
  write([player].concat(state.players))
  return state.players
}

const incrementScores = (whitelist: string[]) => {
  write(state.players.map(player => (
    whitelist.includes(player.id)
      ? { ...player, score: player.score + 1 }
      : player
  )))
  return state.players
}

const remove = (id: string) => {
  write(state.players.filter(player => player.id !== id))
  return state.players
}

const resetReady = () => {
  write(state.players.map(player => ({ ...player, ready: false })))
  return state.players
}

const resetScores = () => {
  write(state.players.map(player => ({ ...player, score: 0, previousScore: 0 })))
  return state.players
}

export default {
  add,
  allReady,
  count,
  countFactor,
  find,
  getReadyCount,
  getWithHighestScores,
  incrementScores,
  isFirstPlace,
  remove,
  resetReady,
  resetScores,
  scoreToWin,
}
