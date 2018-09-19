const R = require('ramda')
const WebSocket = require('ws')
const uuid = require('uuid/v4')

const { Event } = require('signaling')

const {
  warnNotFound,
  wsSend,
  onWsMessage,
  prettyId,
} = require('signaling/common')

const Type = {
  INITIATOR: 'initiator',
  RECEIVER:  'receiver',
}

const { log } = console

// state
let clients = []
// end state

const newClient = socket => ({
  id:   uuid(),
  socket,
  type: Type.INITIATOR, // receiver clients get upgraded in onReceiverCreate
})

const addClient = (client) => {
  clients = clients.concat(client)
  return client
}

const createClient = R.pipe(
  newClient,
  addClient,
)

const removeClient = (id) => {
  clients = clients.filter(c => c.id !== id)
}

const getClient = id => clients.find(x => x.id === id)
const getReceiverClient = receiverId =>
  clients.find(x =>
    x.type === Type.RECEIVER &&
    x.receiverId === receiverId.toUpperCase())

const prettyClient = client => `${client.type}(${prettyId(client.id)})`

const fetchAndMerge = (idKey, fetcher, destKey) => R.ap(
  R.merge,
  R.pipe(
    R.prop(idKey),
    fetcher,
    R.objOf(destKey),
  ),
)

const onReceiverUpgrade = client => (receiverId) => {
  client.type = Type.RECEIVER
  client.receiverId = receiverId
  log(`[Receiver upgrade] ${prettyClient(client)}`)
}

const onOffer = client => R.pipe(
  fetchAndMerge(
    'receiverId',
    getReceiverClient,
    'receiver',
  ),
  R.ifElse(
    R.pipe(
      R.prop('receiver'),
      R.isNil,
    ),
    R.pipe(
      R.prop('receiverId'),
      R.tap(warnNotFound('receiver')),
      wsSend(
        client.socket,
        Event.NOT_FOUND,
      ),
    ),
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
  fetchAndMerge(
    'initiatorId',
    getClient,
    'initiator',
  ),
  R.ifElse(
    R.pipe(
      R.prop('initiator'),
      R.isNil,
    ),
    R.pipe(
      R.prop('initiatorId'),
      warnNotFound('initiator'),
    ),
    ({ initiator, answer }) => {
      log(`[Answer] ${prettyClient(client)} -> ${prettyClient(initiator)}`)
      wsSend(
        initiator.socket,
        Event.ANSWER,
        answer,
      )
    },
  ),

)

const onClose = (client, onReceiverDelete) => () => {
  log(`[Client close] ${prettyClient(client)}`)
  removeClient(client.id)
  if (client.type === Type.RECEIVER) {
    onReceiverDelete(client.receiverId)
  }
}

const init = (port, onReceiverDelete) => {
  const server = new WebSocket.Server({ port })
  log(`[WS] Listening on port ${port}`)

  server.on('connection', (socket) => {
    const client = createClient(socket)
    log(`[Client connect] ${prettyClient(client)}`)
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
    socket.on('close', onClose(client, onReceiverDelete))
  })
}

module.exports = {
  init,
}
