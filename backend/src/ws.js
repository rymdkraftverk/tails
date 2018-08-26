const WebSocket = require('ws')
const uuid = require('uuid/v4')
const { clients } = require('./state')

const { prettyId } = require('common')
const { Event } = require('signaling')

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

const onInitiatorCandidate = client => (event, { candidate, receiverId }) => {
  const receiver = getReceiverClient(receiverId)
  if (!receiver) {
    warn(`Receiver with id ${receiverId} not found`)
    return
  }
  log(`[Initiator Candidate] ${prettyClient(client)} -> ${prettyClient(receiver)}`)
  emit(receiver, event, { candidate, initiatorId: client.id })
}

const onReceiverCandidate = client => (event, { candidate, initiatorId }) => {
  const initiator = getClient(initiatorId)
  if (!initiator) {
    warn(`Initiator with id ${initiatorId} not found`)
    return
  }
  log(`[Receiver Candidate] ${prettyClient(client)} -> ${prettyClient(initiator)}`)
  emit(initiator, event, { candidate })
}

const EventFunctions = {
  [Event.RECEIVER_UPGRADE]:    onReceiverUpgrade,
  [Event.ANSWER]:              onAnswer,
  [Event.INITIATOR_CANDIDATE]: onInitiatorCandidate,
  [Event.RECEIVER_CANDIDATE]:  onReceiverCandidate,
  [Event.OFFER]:               onOffer,
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

const onClose = (deleteReceiverId, client) => () => {
  const i = clients.indexOf(client)
  clients.splice(i, 1)

  if (client.type === Type.RECEIVER) {
    deleteReceiverId(client.receiverId)
  }
}

const init = (port, deleteReceiverId) => {
  const server = new WebSocket.Server({ port })
  log(`ws listening on port ${port}`)

  server.on('connection', (socket) => {
    const client = createClient(socket)
    clients.push(client)
    log(`[Client connected] ${prettyClient(client)}`)

    socket.on('message', onMessage(client))
    socket.on('close', onClose(deleteReceiverId, client))
  })
}

module.exports = {
  init,
}
