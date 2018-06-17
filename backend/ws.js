const WebSocket = require('ws')
const uuid = require('uuid/v4')
const { clients } = require('./state')

const EVENTS = require('../common/events')
const { prettyId } = require('../common/index')

const TYPE = {
  CONTROLLER: 'controller',
  GAME:       'game',
}

const { log, warn } = console

const getClient = id => clients.find(x => x.id === id)
const getGameClient = gameCode =>
  clients.find(x =>
    x.type === TYPE.GAME &&
    x.gameCode === gameCode.toUpperCase())

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

const onGameUpgrade = client => (event, { gameCode }) => {
  client.type = TYPE.GAME
  client.gameCode = gameCode
  log(`[Game upgrade] ${prettyClient(client)}`)
}

const onOffer = client => (event, { gameCode, offer }) => {
  const game = getGameClient(gameCode)
  if (!game) {
    warn(`Game with code ${gameCode} not found`)
    return
  }
  log(`[Offer] ${prettyClient(client)} -> ${prettyClient(game)}`)
  emit(game, event, { offer, controllerId: client.id })
}

const onAnswer = client => (event, { answer, controllerId }) => {
  const controller = getClient(controllerId)
  if (!controller) {
    warn(`Controller with id ${controllerId} not found`)
    return
  }
  log(`[Answer] ${prettyClient(client)} -> ${prettyClient(controller)}`)
  emit(controller, event, { answer })
}

const onControllerCandidate = client => (event, { candidate, gameCode }) => {
  const game = getGameClient(gameCode)
  if (!game) {
    warn(`Game with code ${gameCode} not found`)
    return
  }
  log(`[Controller Candidate] ${prettyClient(client)} -> ${prettyClient(game)}`)
  emit(game, event, { candidate, controllerId: client.id })
}

const onGameCandidate = client => (event, { candidate, controllerId }) => {
  const controller = getClient(controllerId)
  if (!controller) {
    warn(`Controller with id ${controllerId} not found`)
    return
  }
  log(`[Game Candidate] ${prettyClient(client)} -> ${prettyClient(controller)}`)
  emit(controller, event, { candidate })
}

const events = {
  [EVENTS.WS.GAME_UPGRADE]:         onGameUpgrade,
  [EVENTS.WS.ANSWER]:               onAnswer,
  [EVENTS.WS.CONTROLLER_CANDIDATE]: onControllerCandidate,
  [EVENTS.WS.GAME_CANDIDATE]:       onGameCandidate,
  [EVENTS.WS.OFFER]:                onOffer,
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

const onClose = (deleteGameCode, client) => () => {
  const i = clients.indexOf(client)
  clients.splice(i, 1)

  if (client.type === TYPE.GAME) {
    deleteGameCode(client.gameCode)
  }
}

const init = (port, deleteGameCode) => {
  const server = new WebSocket.Server({ port })
  log(`ws listening on port ${port}`)

  server.on('connection', (socket) => {
    const client = createClient(socket)
    clients.push(client)
    log(`[Client connected] ${prettyClient(client)}`)

    socket.on('message', onMessage(client))
    socket.on('close', onClose(deleteGameCode, client))
  })
}

module.exports = {
  init,
}
