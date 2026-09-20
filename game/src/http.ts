const HTTP_ADDRESS = process.env.HTTP_ADDRESS || 'http://localhost:3000'

const postScoreBoard = (scoreBoard: object) => fetch(
  `${HTTP_ADDRESS}/scoreBoard`,
  {
    method:  'POST',
    body:    JSON.stringify(scoreBoard),
    headers: { 'Content-Type': 'application/json' },
  },
)

export default {
  postScoreBoard,
}
