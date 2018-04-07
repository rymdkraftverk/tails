const WebSocket = require('ws')
const uuid = require('uuid/v4')
const { clients } = require('./state')

const PORT = 3000

const TYPE = {
  GAME: 'game',
}

const EVENT = {
  CREATE:               'game.create',
  CREATED:              'game.created',
  ANSWER:               'game.join.answer',
  OFFER:                'game.join.offer',
  CONTROLLER_CANDIDATE: 'game.join.controller.candidate',
  GAME_CANDIDATE:       'game.join.game.candidate',
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

const onOffer = client => (event, { gameCode, offer }) => {
  const gameClient = clients.find(c => c.type === TYPE.GAME && c.gameCode === gameCode)
  if (!gameClient) {
    return
  }

  emit(gameClient, event, { offer, controllerId: client.id })
  log(`Controller client ${client.id} sending offer to game client ${gameClient.id} with game code ${gameCode}`)
}

const onAnswer = client => (event, { answer, controllerId }) => {
  const controllerClient = clients.find(c => c.id === controllerId)
  if (!controllerClient) {
    return
  }

  emit(controllerClient, event, { answer })
  log(`Game client ${client.id} with game code ${client.gameCode} sending answer to controller client ${controllerClient.id}`)
}

const onControllerCandidate = client => (event, { candidate, gameCode }) => {
  const gameClient = clients.find(c => c.type === TYPE.GAME && c.gameCode === gameCode)
  if (!gameClient) {
    return
  }

  emit(gameClient, event, { candidate, controllerId: client.id })
  log(`Controller client ${client.id} sending candidate to game client ${gameClient.id} with game code ${gameCode}`)
}

const onGameCandidate = client => (event, { candidate, controllerId }) => {
  const controllerClient = clients.find(c => c.id === controllerId)
  if (!controllerClient) {
    return
  }

  emit(controllerClient, event, { candidate })
  log(`Game client ${client.id} with game code ${client.gameCode} sending candidate to controller client ${controllerClient.id}`)
}

const events = {
  [EVENT.CREATE]:               onGameCreate,
  [EVENT.ANSWER]:               onAnswer,
  [EVENT.CONTROLLER_CANDIDATE]: onControllerCandidate,
  [EVENT.GAME_CANDIDATE]:       onGameCandidate,
  [EVENT.OFFER]:                onOffer,
}

const onMessage = client => (message) => {
  const { event, payload } = JSON.parse(message)
  const f = events[event.event]
  if (f) f(client)(event, payload)
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
