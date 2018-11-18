const http = require('http')
const express = require('express')
const cors = require('cors')

const gameCode = require('./gameCode')

const { error, log } = console

const init = (port) => {
  const app = express()
  app.use(cors())

  app.post('/game', (req, res) => {
    gameCode.create()
      .then((code) => {
        res.json({ gameCode: code })
        log(`[Game created] ${code}`)
      })
      .catch(error)
  })

  const httpServer = http.createServer(app)
  httpServer.listen(port)
  return httpServer
}

module.exports = {
  init,
}
