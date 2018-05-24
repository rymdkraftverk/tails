const express = require('express')
const cors = require('cors')

const app = express()
app.use(cors())
const { log } = console

const parseArgs = require('./parse-args')
const { prepareMakeGameCode } = require('./make-game-code')

const args = parseArgs(process.argv)
const makeGameCode = prepareMakeGameCode(args.redis)

app.post('/game', (req, res) => {
  makeGameCode()
    .then((gameCode) => {
      res.json({ gameCode })
      log(`[Game created] ${gameCode}`)
    })
})

const init = (port) => {
  app.listen(port)
  log(`http listening on port ${port}`)
}

module.exports = {
  init,
}
