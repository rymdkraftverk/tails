const ws = require('./ws')
const http = require('./http')
const gameCode = require('./gameCode')

const { error, log } = console

const port = process.env.PORT || 3000

const httpServer = http.init(port)
ws.init(httpServer, gameCode.delete)

log(`[HTTP/WS] Listening on port ${port}`)

process.on('uncaughtException', (err) => {
  error('UNCAUGHT EXCEPTION')
  error(err)
})
