import { state } from '../state'

const scoreBoard = (players: Player[]) => Object.fromEntries(
  players.map(({ color, score }) => [color, score]),
)

const identifiableScoreBoard = () => ({
  code:       state.gameCode,
  scoreBoard: scoreBoard(state.players),
})

export default {
  identifiableScoreBoard,
}
