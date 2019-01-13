const http = require('http')
const express = require('express')
const cors = require('cors')

const gameCode = require('./gameCode')

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

const init = (port) => {
  const app = express()
  app.use(cors())

  addGameEndpoint(app)

  const httpServer = http.createServer(app)
  httpServer.listen(port)
  return httpServer
}

module.exports = {
  init,
}
