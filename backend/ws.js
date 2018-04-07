const WebSocket = require('ws')
const uuid = require('uuid/v4')
const { clients } = require('./state')

const PORT = 3000

const TYPE = {
  GAME: 'game',
}

const EVENT = {
  CREATE:    'game.create',
  CREATED:   'game.created',
  ANSWER:    'game.join.answer',
  OFFER:     'game.join.offer',
  CANDIDATE: 'game.join.controller.candidate',
}

const { log } = console

const createClient = socket => ({
  id: uuid(),
  socket,
})

const makeGameCode = () => Math.random().toString(36).substring(2, 6)

const emit = (client, event, payload) => {
  const message = JSON.stringify({ event, payload })
  client.socket.send(message)
}

const onGameCreate = client => () => {
  const gameCode = makeGameCode()

  client.type = TYPE.GAME
  client.gameCode = gameCode

  emit(client, EVENT.CREATED, gameCode)
  log(`Game created: ${gameCode}`)
}

const events = {
  [EVENT.CREATE]: onGameCreate,
}

const onMessage = client => (message) => {
  const { event } = JSON.parse(message)
  const f = events[event]
  if (f) f(client)()
}

const onClose = client => () => {
  const i = clients.indexOf(client)
  clients.splice(i, 1)
}

const init = () => {
  const server = new WebSocket.Server({ port: PORT })
  log(`listening on port ${PORT}`)

  server.on('connection', (socket) => {
    const client = createClient(socket)
    clients.push(client)

    socket.on('message', onMessage(client))
    socket.on('close', onClose(client))
  })
}

module.exports = {
  init,
}
