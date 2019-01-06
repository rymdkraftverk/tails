const ws = require('./ws')
const http = require('./http')
const gameCode = require('./gameCode')

const { error, log } = console

const PORT = process.env.PORT || 3000
const VERSION = process.env.VERSION || 'N/A'

log(`Version: ${VERSION}`)

const httpServer = http.init(PORT)
ws.init(httpServer, gameCode.delete)

log(`[HTTP/WS] Listening on port ${PORT}`)

process.on('uncaughtException', (err) => {
  error('UNCAUGHT EXCEPTION')
  error(err)
})
