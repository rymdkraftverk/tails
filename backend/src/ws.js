const R = require('ramda')
const WebSocket = require('ws')
const uuid = require('uuid/v4')

const {
  common: {
    warnNotFound,
    wsSend,
    onWsMessage,
    prettyId,
  },
  Event,
} = require('rkv-signaling')

const Type = {
  INITIATOR: 'initiator',
  RECEIVER:  'receiver',
}

const { log } = console

// state
let clients = []
// end state

const instantiateClient = socket => ({
  id:   uuid(),
  socket,
  type: Type.INITIATOR, // receiver clients get upgraded in onReceiverCreate
})

const addClient = (client) => {
  clients = clients.concat(client)
  return client
}

const createClient = R.pipe(
  instantiateClient,
  addClient,
)

const removeClient = (id) => {
  clients = clients.filter(c => c.id !== id)
}

const getClient = id => clients.find(x => x.id === id)
const getReceiverClient = receiverId => clients.find(x => x.type === Type.RECEIVER
    && x.receiverId === receiverId.toUpperCase())

const prettyClient = client => `${client.type}(${prettyId(client.id)})`

const pingMessage = client => `[Ping] ${prettyId(client.id)}`

const fetchAndMerge = (idKey, fetcher, destKey) => R.ap(
  R.merge,
  R.pipe(
    R.prop(idKey),
    fetcher,
    R.objOf(destKey),
  ),
)

const receiverIsNil = R.pipe(
  R.prop('receiver'),
  R.isNil,
)

const warnReceiverNotFoundAndSend = socket => R.pipe(
  R.prop('receiverId'),
  R.tap(warnNotFound('receiver')),
  wsSend(socket, Event.NOT_FOUND),
)

const logAndSendOffer = client => ({ receiver, channelInfos, offer }) => {
  log(`[Offer] ${prettyClient(client)} -> ${prettyClient(receiver)}`)

  wsSend(
    receiver.socket,
    Event.OFFER,
    {
      channelInfos,
      initiatorId: client.id,
      offer,
    },
  )
}

const initiatorIsNil = R.pipe(
  R.prop('initiator'),
  R.isNil,
)

const warnInitatorNotFound = R.pipe(
  R.prop('initiatorId'),
  warnNotFound('initiator'),
)

const logAndSendAnswer = client => ({ initiator, answer }) => {
  log(`[Answer] ${prettyClient(client)} -> ${prettyClient(initiator)}`)
  wsSend(
    initiator.socket,
    Event.ANSWER,
    answer,
  )
}

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
    receiverIsNil,
    warnReceiverNotFoundAndSend(client.socket),
    logAndSendOffer(client),
  ),
)

const onAnswer = client => R.pipe(
  fetchAndMerge(
    'initiatorId',
    getClient,
    'initiator',
  ),
  R.ifElse(
    initiatorIsNil,
    warnInitatorNotFound,
    logAndSendAnswer(client),
  ),
)

const onClose = (client, onReceiverDelete, keepAliveId) => () => {
  log(`[Client close] ${prettyClient(client)}`)
  clearInterval(keepAliveId)
  removeClient(client.id)
  if (client.type === Type.RECEIVER) {
    onReceiverDelete(client.receiverId)
  }
}

const init = (httpServer, onReceiverDelete) => {
  const server = new WebSocket.Server({ server: httpServer })

  server.on('connection', (socket) => {
    const client = createClient(socket)
    log(`[Client connect] ${prettyClient(client)}`)
    wsSend(
      client.socket,
      Event.CLIENT_ID,
      client.id,
    )

    // Heroku times out all HTTP requests after 55 sec of inactivity
    // https://devcenter.heroku.com/articles/http-routing#timeouts
    const keepAliveId = setInterval(
      () => { socket.ping(pingMessage(client)) },
      30000, // 30 sec
    )

    // Uncomment to debug ping/pong
    // socket.on('pong', R.pipe(R.invoker(0, 'toString'), log))

    socket.on('message', onWsMessage({
      [Event.RECEIVER_UPGRADE]: onReceiverUpgrade(client),
      [Event.ANSWER]:           onAnswer(client),
      [Event.OFFER]:            onOffer(client),
    }))
    socket.on('close', onClose(client, onReceiverDelete, keepAliveId))
  })
}

module.exports = {
  init,
}
