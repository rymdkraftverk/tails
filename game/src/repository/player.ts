import * as l2 from 'l2'
import { state } from '../state'

const players = l2.repository<Player>({
  name:  'player',
  read:  () => state.players,
  write: (updated) => {
    state.players = updated
  },
})

const isHuman = ({ bot }: Player) => bot === undefined

const isReady = (player: Player) => !isHuman(player) || player.ready === true

const getHighestScore = (all: Player[]) => all
  .reduce((highest, { score }) => Math.max(highest, score), 0)

const allReady = () => players
  .all()
  .every(isReady)

const countFactor = () => Math.sqrt(players.count())

const getReadyCount = () => players
  .all()
  .filter(player => isHuman(player) && isReady(player))
  .length

const getWithHighestScores = () => {
  const highest = getHighestScore(players.all())
  return players
    .all()
    .filter(({ score }) => score === highest)
}

const isFirstPlace = (id: string) => getWithHighestScores()
  .filter(({ score }) => score !== 0)
  .some(player => player.id === id)

const scoreToWin = () => (players.count() - 1) * 3

const incrementScores = (whitelist: string[]) => players.change(player => (
  whitelist.includes(player.id)
    ? { ...player, score: player.score + 1 }
    : player
))

const resetReady = () => players.change(player => ({ ...player, ready: false }))

const resetScores = () => players.change(player => ({
  ...player,
  score:         0,
  previousScore: 0,
}))

export default {
  ...players,
  allReady,
  countFactor,
  getReadyCount,
  getWithHighestScores,
  incrementScores,
  isFirstPlace,
  resetReady,
  resetScores,
  scoreToWin,
}
