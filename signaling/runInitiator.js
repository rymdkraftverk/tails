const R = require('ramda')
const Event = require('./event')
const Channel = require('./channel')
const {
  WEB_RTC_CONFIG,
  makeCloseConnections,
  makeOnMessage,
  mappify,
  onWsMessage,
  prettyId,
  rtcSend,
  warnNotFound,
  wsSend,
} = require('./common')

const { error, log, warn } = console

// state
let wsSendX = null
let closeConnections = null
let channelMap = null
let id = null
// end state

const listenForHeartbeat = ({ event }) => {
  const isHeartbeat = event === Event.HEARTBEAT
  if (isHeartbeat) {
    rtcSend(
      channelMap,
      Channel.RELIABLE,
      { event: Event.HEARTBEAT, payload: id },
    )
  }

  return { interupt: isHeartbeat }
}

const onIceCandidate = (rtc, receiverId) => ({ candidate }) => {
  if (candidate) {
    log('[Ice Candidate]')
    return
  }

  log('[Sending offer] Last candidate retrieved')
  wsSendX(Event.OFFER, { receiverId, offer: rtc.localDescription })
}

const createOffer = rtc => () => rtc
  .createOffer()
  .then(offer => Promise.all([
    offer,
    rtc.setLocalDescription(offer),
  ]))

const onAnswer = rtc => R.bind(rtc.setRemoteDescription, rtc)

const onReceiverNotFound = onFailure => (receiverId) => {
  warnNotFound('receiver')(receiverId)
  closeConnections()
  onFailure({ cause: 'NOT_FOUND' })
}

const onInitiatorId = (initiatorId) => {
  id = initiatorId
  log(`[Id] ${prettyId(id)}`)
}

const setUpChannel = rtc => ({
  name, config, onClose, onData,
}) => {
  const channel = rtc.createDataChannel(
    name,
    config,
  )

  channel.onerror = R.pipe(
    R.tap(error),
    closeConnections,
  )

  channel.onclose = R.pipe(
    R.tap(warn),
    onClose,
  )

  channel.onmessage = makeOnMessage([listenForHeartbeat, onData])

  // Channel considered "set up" once it's opened
  return new Promise((resolve) => {
    channel.onopen = () => {
      log(`[Data channel] ${channel.label}`)
      resolve(channel)
    }
  })
}

const init = ({
  onClose,
  onData,
  receiverId,
  wsAddress,
}) => new Promise((resolve, reject) => {
  const rtc = new RTCPeerConnection(WEB_RTC_CONFIG)
  rtc.onicecandidate = onIceCandidate(rtc, receiverId)

  const ws = new WebSocket(wsAddress)
  wsSendX = wsSend(ws)
  ws.onopen = createOffer(rtc)
  ws.onmessage = R.pipe(
    R.prop('data'),
    onWsMessage({
      [Event.ANSWER]:    onAnswer(rtc),
      [Event.NOT_FOUND]: onReceiverNotFound(reject),
      [Event.CLIENT_ID]: onInitiatorId,
    }),
  )

  closeConnections = makeCloseConnections([rtc, ws])

  // configuration explanation:
  // https://jameshfisher.com/2017/01/17/webrtc-datachannel-reliability.html
  const channelConfigs = [{
    // "udpLike"
    name:   Channel.UNRELIABLE,
    config: {
      ordered:        false,
      maxRetransmits: 0,
    },
    onData,
    onClose,
  },
  {
    // "tcpLike"
    name:   Channel.RELIABLE,
    config: {
      ordered: true,
    },
    onData,
    onClose,
  }]

  R.pipe(
    R.map(setUpChannel(rtc)),
    R.bind(Promise.all, Promise),
  )(channelConfigs)
    .then(R.pipe(
      R.flip(mappify)('label'),
      R.tap((cm) => { channelMap = cm }),
      rtcSend,
      resolve,
    ))
})

module.exports = init
