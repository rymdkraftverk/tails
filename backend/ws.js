const WebSocket = require('ws')
const uuid = require('uuid/v4')
const { clients } = require('./state')
const parseArgs = require('./parse-args')
const { prepareMakeGameCode, prepareDeleteGameCode } = require('./make-game-code')

const EVENTS = require('../common/events')

const PORT = 3000

const TYPE = {
  GAME: 'game',
}

const { log, warn } = console

const args = parseArgs(process.argv)
const makeGameCode = prepareMakeGameCode(args.redis)
const deleteGameCode = prepareDeleteGameCode(args.redis)

const getClient = id => clients.find(x => x.id === id)
const getGameClient = gameCode =>
  clients.find(x =>
    x.type === TYPE.GAME &&
    x.gameCode === gameCode.toUpperCase())

const createClient = socket => ({
  id: uuid(),
  socket,
})

const emit = (client, event, payload) => {
  const message = JSON.stringify({ event, payload })
  client.socket.send(message)
}

const onGameCreate = client => () => {
  makeGameCode()
    .then((gameCode) => {
      client.type = TYPE.GAME
      client.gameCode = gameCode

      emit(client, EVENTS.CREATED, { gameCode })
      log(`Game created: ${gameCode}`)
    })
}

const onOffer = client => (event, { gameCode, offer }) => {
  const game = getGameClient(gameCode)
  if (!game) {
    return
  }

  emit(game, event, { offer, controllerId: client.id })
  log(`Controller client ${client.id} sending offer to game client ${game.id} with game code ${gameCode}`)
}

const onAnswer = client => (event, { answer, controllerId }) => {
  const controller = getClient(controllerId)
  if (!controller) {
    return
  }

  emit(controller, event, { answer })
  log(`Game client ${client.id} with game code ${client.gameCode} sending answer to controller client ${controller.id}`)
}

const onControllerCandidate = client => (event, { candidate, gameCode }) => {
  const game = getGameClient(gameCode)
  if (!game) {
    return
  }

  emit(game, event, { candidate, controllerId: client.id })
  log(`Controller client ${client.id} sending candidate to game client ${game.id} with game code ${gameCode}`)
}

const onGameCandidate = client => (event, { candidate, controllerId }) => {
  const controller = getClient(controllerId)
  if (!controller) {
    return
  }

  emit(controller, event, { candidate })
  log(`Game client ${client.id} with game code ${client.gameCode} sending candidate to controller client ${controller.id}`)
}

const events = {
  [EVENTS.CREATE]:               onGameCreate,
  [EVENTS.ANSWER]:               onAnswer,
  [EVENTS.CONTROLLER_CANDIDATE]: onControllerCandidate,
  [EVENTS.GAME_CANDIDATE]:       onGameCandidate,
  [EVENTS.OFFER]:                onOffer,
}

const onMessage = client => (message) => {
  const { event, payload } = JSON.parse(message)
  const f = events[event]
  if (!f) {
    warn(`Unhandled event for message: ${message}`)
    return
  }
  f(client)(event, payload)
}

const onClose = client => () => {
  const i = clients.indexOf(client)
  clients.splice(i, 1)

  if (client.type === TYPE.GAME) {
    deleteGameCode(client.gameCode)
  }
}

const init = () => {
  const server = new WebSocket.Server({ port: PORT })
  log(`listening on port ${PORT}`)

  server.on('connection', (socket) => {
    const client = createClient(socket)
    clients.push(client)
    log(`Client connected: ${client.id}`)

    socket.on('message', onMessage(client))
    socket.on('close', onClose(client))
  })
}

module.exports = {
  init,
}
