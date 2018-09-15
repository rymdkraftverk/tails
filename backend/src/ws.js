const WebSocket = require('ws')
const uuid = require('uuid/v4')
const { clients } = require('./state')

const { prettyId } = require('common')
const { Event } = require('signaling')

const gameCode = require('./gameCode')

const Type = {
  INITIATOR: 'initiator',
  RECEIVER:  'receiver',
}

const { log, warn } = console

const getClient = id => clients.find(x => x.id === id)
const getReceiverClient = receiverId =>
  clients.find(x =>
    x.type === Type.RECEIVER &&
    x.receiverId === receiverId.toUpperCase())

const prettyClient = client => `${client.type}(${prettyId(client.id)})`

const createClient = socket => ({
  id:   uuid(),
  socket,
  type: Type.INITIATOR, // receiver clients get upgraded in onReceiverCreate
})

const emit = (client, event, payload) => {
  const message = JSON.stringify({ event, payload })
  client.socket.send(message)
}

const onReceiverUpgrade = client => (event, receiverId) => {
  client.type = Type.RECEIVER
  client.receiverId = receiverId
  log(`[Receiver upgrade] ${prettyClient(client)}`)
}

const onOffer = client => (event, { receiverId, offer }) => {
  const receiver = getReceiverClient(receiverId)
  if (!receiver) {
    warn(`Receiver with id ${receiverId} not found`)
    emit(client, Event.NOT_FOUND, { receiverId })
    return
  }
  log(`[Offer] ${prettyClient(client)} -> ${prettyClient(receiver)}`)
  emit(receiver, event, { offer, initiatorId: client.id })
}

const onAnswer = client => (event, { answer, initiatorId }) => {
  const initiator = getClient(initiatorId)
  if (!initiator) {
    warn(`Initiator with id ${initiatorId} not found`)
    return
  }
  log(`[Answer] ${prettyClient(client)} -> ${prettyClient(initiator)}`)
  emit(initiator, event, { answer })
}

const EventFunctions = {
  [Event.RECEIVER_UPGRADE]: onReceiverUpgrade,
  [Event.ANSWER]:           onAnswer,
  [Event.OFFER]:            onOffer,
}

const onMessage = client => (message) => {
  const { event, payload } = JSON.parse(message)
  const f = EventFunctions[event]
  if (!f) {
    warn(`Unhandled event for message: ${message}`)
    return
  }
  f(client)(event, payload)
}

const onClose = client => () => {
  const i = clients.indexOf(client)
  clients.splice(i, 1)

  if (client.type === Type.RECEIVER) {
    // TODO: use emitter instead not to leak "game" into signaling
    gameCode.delete(client.receiverId)
  }
}

const init = (port) => {
  const server = new WebSocket.Server({ port })
  log(`[WS] Listening on port ${port}`)

  server.on('connection', (socket) => {
    const client = createClient(socket)
    clients.push(client)
    log(`[Client connected] ${prettyClient(client)}`)
    emit(client, Event.CLIENT_ID, client.id)

    socket.on('message', onMessage(client))
    socket.on('close', onClose(client))
  })
}

module.exports = {
  init,
}
