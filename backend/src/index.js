const ws = require('./ws')
const http = require('./http')
const gameCode = require('./gameCode')

const { error } = console

ws.init(3000, gameCode.delete)
http.init(3001)

process.on('uncaughtException', (err) => {
  error('UNCAUGHT EXCEPTION')
  error(err)
})
