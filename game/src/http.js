const HTTP_ADDRESS = process.env.HTTP_ADDRESS || 'http://localhost:3000'

const createGame = () => fetch(
  `${HTTP_ADDRESS}/game`,
  {
    method: 'POST',
  },
)
  .then(res => res.json())

const postScoreBoard = scoreBoard => fetch(
  `${HTTP_ADDRESS}/scoreBoard`,
  {
    method:  'POST',
    body:    JSON.stringify(scoreBoard),
    headers: { 'Content-Type': 'application/json' },
  },
)

export default {
  createGame,
  postScoreBoard,
}
