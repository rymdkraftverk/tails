const express = require('express')
const cors = require('cors')

const gameCode = require('./gameCode')

const { log } = console

const init = (port) => {
  const app = express()
  app.use(cors())

  app.post('/game', (req, res) => {
    gameCode.create()
      .then((code) => {
        res.json({ gameCode: code })
        log(`[Game created] ${code}`)
      })
  })

  app.listen(port)
  log(`[HTTP] Listening on port ${port}`)
}

module.exports = {
  init,
}
