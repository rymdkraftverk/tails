const WebSocket = require('ws')
const uuid = require('uuid/v4')
const { clients } = require('./state')
const parseArgs = require('./parse-args')
const { prepareMakeGameCode, prepareDeleteGameCode } = require('./make-game-code')

const EVENTS = require('../common/events')

const PORT = 3000

const TYPE = {
  CONTROLLER: 'controller',
  GAME:       'game',
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

const prettyId = id => id.substring(0, 4)
const prettyClient = client => `${client.type}(${prettyId(client.id)})`

const createClient = socket => ({
  id:   uuid(),
  socket,
  type: TYPE.CONTROLLER, // game clients get upgraded in onGameCreate
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
      log(`[Controller upgraded] ${prettyClient(client)}`)

      emit(client, EVENTS.CREATED, { gameCode })
      log(`[Game created] ${gameCode}`)
    })
}

const onOffer = client => (event, { gameCode, offer }) => {
  const game = getGameClient(gameCode)
  if (!game) {
    return
  }

  log(`[Offer] ${prettyClient(client)} -> ${prettyClient(game)}`)
  emit(game, event, { offer, controllerId: client.id })
}

const onAnswer = client => (event, { answer, controllerId }) => {
  const controller = getClient(controllerId)
  if (!controller) {
    return
  }

  log(`[Answer] ${prettyClient(client)} -> ${prettyClient(controller)}`)
  emit(controller, event, { answer })
}

const onControllerCandidate = client => (event, { candidate, gameCode }) => {
  const game = getGameClient(gameCode)
  if (!game) {
    return
  }

  log(`[Controller Candidate] ${prettyClient(client)} -> ${prettyClient(game)}`)
  emit(game, event, { candidate, controllerId: client.id })
}

const onGameCandidate = client => (event, { candidate, controllerId }) => {
  const controller = getClient(controllerId)
  if (!controller) {
    return
  }

  log(`[Game Candidate] ${prettyClient(client)} -> ${prettyClient(controller)}`)
  emit(controller, event, { candidate })
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
    log(`[Client connected] ${prettyClient(client)}`)

    socket.on('message', onMessage(client))
    socket.on('close', onClose(client))
  })
}

module.exports = {
  init,
}
