const ws = require('./ws')

const { error } = console

ws.init()

process.on('uncaughtException', (err) => {
  error('UNCAUGHT EXCEPTION')
  error(err)
})
