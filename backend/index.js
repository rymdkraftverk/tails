const ws = require('./ws')
const http = require('./http')

const { error } = console

ws.init(3000)
http.init(3001)

process.on('uncaughtException', (err) => {
  error('UNCAUGHT EXCEPTION')
  error(err)
})
