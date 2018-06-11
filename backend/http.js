const express = require('express')
const cors = require('cors')

const { log } = console

const init = (port, createGameCode) => {
  const app = express()
  app.use(cors())

  app.post('/game', (req, res) => {
    createGameCode()
      .then((gameCode) => {
        res.json({ gameCode })
        log(`[Game created] ${gameCode}`)
      })
  })

  app.listen(port)
  log(`http listening on port ${port}`)
}

module.exports = {
  init,
}
