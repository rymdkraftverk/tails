const WebSocket = require('ws')
const uuid = require('uuid/v4')
const { clients } = require('./state')

const { prettyId } = require('common')
const { Event } = require('signaling')

const {
  onWsMessage,
} = require('signaling/common')

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

const onReceiverUpgrade = client => (receiverId) => {
  client.type = Type.RECEIVER
  client.receiverId = receiverId
  log(`[Receiver upgrade] ${prettyClient(client)}`)
}

const onOffer = client => ({ receiverId, offer }) => {
  const receiver = getReceiverClient(receiverId)
  if (!receiver) {
    warn(`Receiver with id ${receiverId} not found`)
    emit(client, Event.NOT_FOUND, { receiverId })
    return
  }
  log(`[Offer] ${prettyClient(client)} -> ${prettyClient(receiver)}`)
  emit(receiver, Event.OFFER, { offer, initiatorId: client.id })
}

const onAnswer = client => ({ answer, initiatorId }) => {
  const initiator = getClient(initiatorId)
  if (!initiator) {
    warn(`Initiator with id ${initiatorId} not found`)
    return
  }
  log(`[Answer] ${prettyClient(client)} -> ${prettyClient(initiator)}`)
  emit(initiator, Event.ANSWER, { answer })
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

    socket.on('message', onWsMessage({
      [Event.RECEIVER_UPGRADE]: onReceiverUpgrade(client),
      [Event.ANSWER]:           onAnswer(client),
      [Event.OFFER]:            onOffer(client),
    }))
    socket.on('close', onClose(client))
  })
}

module.exports = {
  init,
}
