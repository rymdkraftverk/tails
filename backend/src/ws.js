const R = require('ramda')
const WebSocket = require('ws')
const uuid = require('uuid/v4')
const { clients } = require('./state')

const { Event } = require('signaling')

const {
  wsSend,
  onWsMessage,
  prettyId,
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

const onReceiverUpgrade = client => (receiverId) => {
  client.type = Type.RECEIVER
  client.receiverId = receiverId
  log(`[Receiver upgrade] ${prettyClient(client)}`)
}

const onOffer = client => R.pipe(
  R.ap(
    R.merge,
    R.pipe(
      R.prop('receiverId'),
      getReceiverClient,
      R.objOf('receiver'),
    ),
  ),
  R.ifElse(
    R.pipe(
      R.prop('receiver'),
      R.isNil,
    ),
    ({ receiverId }) => {
      warn(`Receiver with id ${receiverId} not found`)
      wsSend(
        client.socket,
        Event.NOT_FOUND,
        { receiverId },
      )
    },
    ({ receiver, offer }) => {
      log(`[Offer] ${prettyClient(client)} -> ${prettyClient(receiver)}`)

      wsSend(
        receiver.socket,
        Event.OFFER,
        {
          offer,
          initiatorId: client.id,
        },
      )
    },
  ),
)

const onAnswer = client => R.pipe(
  R.ap(
    R.merge,
    R.pipe(
      R.prop('initiatorId'),
      getClient,
      R.objOf('initiator'),
    ),
  ),
  R.ifElse(
    R.pipe(
      R.prop('initiator'),
      R.isNil,
    ),
    ({ initiatorId }) => { warn(`Initiator with id ${initiatorId} not found`) },
    ({ initiator, answer }) => {
      log(`[Answer] ${prettyClient(client)} -> ${prettyClient(initiator)}`)
      wsSend(
        initiator.socket,
        Event.ANSWER,
        { answer },
      )
    },
  ),

)

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
    wsSend(
      client.socket,
      Event.CLIENT_ID,
      client.id,
    )

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
