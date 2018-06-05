import EVENTS from '../../common/events'

const { error, log, warn } = console

const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
}

const onClientICECandidate = (conn, controllerId) => (rtcEvent) => {
  log('onicecandidate', rtcEvent)
  if (!rtcEvent.candidate) {
    return
  }

  const client = conn.clients.get(controllerId)
  if (!client) {
    log(`client ${controllerId} was not found in conn.clients`)
    return
  }

  client.candidates = client.candidates.concat(rtcEvent.candidate)
  emit(
    conn.ws,
    EVENTS.GAME_CANDIDATE,
    {
      candidate:    rtcEvent.candidate,
      controllerId: client.controllerId,
    },
  )
}

const onClientData = (conn, controllerId) => (e) => {
  const data = JSON.parse(e.data)
  conn.callbacks.onData(conn, controllerId, data)
}

const onClientDataChannel = (conn, controllerId) => (rtcEvent) => {
  const client = conn.clients.get(controllerId)
  if (!client) {
    log(`failed to find client ${controllerId} when setting data channel`)
    return
  }
  client.channel = rtcEvent.channel

  /* eslint-disable-next-line */
  rtcEvent.channel.onmessage = onClientData(conn, controllerId)
  log(`client ${controllerId} on data channel`)
}

const createClient = (controllerId, rtc) => ({
  rtcClient:  rtc,
  controllerId,
  candidates: [],
})

const setLocalDescriptor = rtc => (answer) => {
  rtc.setLocalDescription(answer)
  return answer
}

const sendAnswer = (conn, controllerId) => (answer) => {
  emit(conn.ws, EVENTS.ANSWER, { answer, controllerId })
}

const createRtcClient = (config, conn, controllerId) => {
  const rtc = new RTCPeerConnection(config)
  rtc.onicecandidate = onClientICECandidate(conn, controllerId)
  rtc.ondatachannel = onClientDataChannel(conn, controllerId)
  return rtc
}

const convertOfferToAnswer = (rtc, offer) => rtc
  .setRemoteDescription(new RTCSessionDescription(offer))
  .then(() => rtc.createAnswer())
  .then(setLocalDescriptor(rtc))


const onOffer = conn => (event, { offer, controllerId }) => {
  log('received EVENTS.OFFER offer: ', offer)
  log('received EVENTS.OFFER controllerId: ', controllerId)

  const rtc = createRtcClient(configuration, conn, controllerId)
  conn.clients.set(controllerId, createClient(controllerId, rtc))
  convertOfferToAnswer(rtc, offer).then(sendAnswer(conn, controllerId))
}

const onControllerCandidate = conn => (event, { controllerId, candidate }) => {
  log('received EVENTS.CONTROLLER_CANDIDATE offer: ', candidate)

  const client = conn.clients.get(controllerId)
  if (!client) {
    log(`failed to find client ${controllerId} in conn.clients`)
    return
  }

  client.rtcClient.addIceCandidate(new RTCIceCandidate(candidate))
  client
    .candidates
    .forEach(c => emit(conn.ws, EVENTS.GAME_CANDIDATE, { candidate: c, controllerId }))
  client.candidate = []
}

const emit = (ws, event, payload) => {
  const message = JSON.stringify({ event, payload })
  ws.send(message)
}

const createGame = (httpAddress, ws, onGameCreated) => {
  fetch(`${httpAddress}/game`, { method: 'POST' })
    .then(res => res.json())
    .then(({ gameCode }) => {
      emit(ws, EVENTS.GAME_UPGRADE, { gameCode })
      onGameCreated({ gameCode })
      log('gameId', gameCode)
    })
    .catch(error)
}

const onMessage = (events, conn) => (message) => {
  const { event, payload } = JSON.parse(message.data)
  const f = events[event]
  if (!f) {
    warn(`Unhandled event for message: ${message.data}`)
    return
  }
  f(conn)(event, payload)
}

const send = (c, controllerId, data) => {
  const client = c.clients.get(controllerId)
  if (!client) {
    return false
  }

  client.channel.send(JSON.stringify(data))
  return true
}

const close = (c, controllerId) => {
  const client = c.get(controllerId)
  if (!client) {
    return false
  }

  client.rtc.close()
  c.clients.delete(controllerId)
  return true
}

const create = (wsAdress, httpAddress, callbacks) => {
  const ws = new WebSocket(wsAdress)
  const conn = {
    gameCode: null,
    callbacks,
    ws,
    clients:  new Map(),
  }

  const events = {
    [EVENTS.OFFER]:                onOffer,
    [EVENTS.CONTROLLER_CANDIDATE]: onControllerCandidate,
  }

  ws.onopen = () => createGame(httpAddress, ws, callbacks.onGameCreated)
  ws.onmessage = onMessage(events, conn)

  return conn
}

module.exports = {
  connCreate: create,
  connSend:   send,
  connClose:  close,
}
