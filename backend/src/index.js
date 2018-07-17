const ws = require('./ws')
const http = require('./http')
const connectToRedis = require('./make-game-code')

const { createGameCode, deleteGameCode } = connectToRedis(process.env.REDIS_PATH)

const { error } = console

ws.init(3000, deleteGameCode)
http.init(3001, createGameCode)

process.on('uncaughtException', (err) => {
  error('UNCAUGHT EXCEPTION')
  error(err)
})
