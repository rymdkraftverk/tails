const http = require('https')
const express = require('express')
const cors = require('cors')

const config = require('./config')
const gameCode = require('./gameCode')
const slack = require('./slack')

const { error, log } = console

const addGameEndpoint = (app) => {
  app.post('/game', (req, res) => {
    gameCode.create()
      .then((code) => {
        res.json({ gameCode: code })
        log(`[Game created] ${code}`)
      })
      .catch(error)
  })
}

const addScoreBoardEndpoint = (app) => {
  app.post('/scoreBoard', (req, res) => {
    slack.postScoreBoard(req.body)
      .then(() => {
        res.sendStatus(200)
      })
      .catch(error)
  })
}

const init = (port) => {
  const app = express()
  app.use(express.json())
  app.use(cors({
    origin: config.corsWhitelist,
  }))

  addGameEndpoint(app)
  addScoreBoardEndpoint(app)

  app.get('/hello', (req, res) => res.json({ foo: 'FOO' }))

  const httpServer = http.createServer(app)
  httpServer.listen(port)
  return httpServer
}

module.exports = {
  init,
}
