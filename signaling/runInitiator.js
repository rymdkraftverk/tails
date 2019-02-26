const R = require('ramda')
const Event = require('./event')
const {
  HEARTBEAT_INTERVAL,
  INTERNAL_CHANNEL,
  WEB_RTC_CONFIG,
  hoistInternal,
  makeCloseConnections,
  makeOnRtcMessage,
  mappify,
  onWsMessage,
  packageChannels,
  prettyId,
  rtcMapSend,
  rtcSend,
  warnNotFound,
  wsSend,
} = require('./common')

const HEARTBEAT_PADDING = HEARTBEAT_INTERVAL / 2 // network delays and whatnot
const HEARTBEAT_PATIENCE = HEARTBEAT_INTERVAL + HEARTBEAT_PADDING

const { error, log, warn } = console

// state
let closeConnections = null
let internalChannel
let id = null
let killTimer = null
// end state

const deferDeath = () => {
  clearTimeout(killTimer)

  killTimer = setTimeout(
    closeConnections,
    HEARTBEAT_PATIENCE,
  )
}

const onInternalData = ({ event }) => {
  if (event !== Event.HEARTBEAT) {
    warn(`Unhandled internal event ${event}`)
    return
  }

  deferDeath()

  rtcSend(
    JSON.stringify,
    internalChannel,
    { event: Event.HEARTBEAT, payload: id },
  )
}

const sendOffer = ({
  channelInfos,
  receiverId,
  rtc,
  send,
}) => () => {
  send(
    Event.OFFER,
    {
      channelInfos,
      offer: rtc.localDescription,
      receiverId,
    },
  )
}

const onIceCandidate = allReceived => R.ifElse(
  R.pipe(
    R.prop('candidate'),
    R.isNil,
  ),
  () => {
    log('[Ice Candidate] Last retrieved')
    allReceived()
  },
  () => log('[Ice Candidate]'),
)

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

const plumbChannelConfig = external => R.ifElse(
  R.equals(INTERNAL_CHANNEL),
  R.merge({
    onData:  onInternalData,
    onClose: () => warn('Internal channel closed'),
  }),
  R.merge(external),
)

const setUpChannel = rtc => ({
  name,
  config,
  protobuf,
  onClose,
  onData,
}) => {
  const channel = rtc.createDataChannel(
    name,
    config,
  )

  channel.binaryType = 'arraybuffer'

  channel.onerror = R.pipe(
    R.tap(error),
    closeConnections,
  )

  channel.onclose = R.pipe(
    R.tap(warn),
    onClose,
  )

  channel.onmessage = makeOnRtcMessage({
    protobuf,
    onData,
  })

  // Channel considered "set up" once it's opened
  return new Promise((resolve) => {
    channel.onopen = () => {
      log(`[Data channel] ${channel.label}`)
      resolve(channel)
    }
  })
}

const init = ({
  channelConfigs: externalChannelConfigs,
  onClose,
  onData,
  receiverId,
  wsAddress,
}) => new Promise((resolve, reject) => {
  const rtc = new RTCPeerConnection(WEB_RTC_CONFIG)
  const ws = new WebSocket(wsAddress)

  const channelConfigs = R.append(
    INTERNAL_CHANNEL,
    externalChannelConfigs,
  )

  const channelInfos = R.map(
    R.pick(['name', 'protobuf']),
    channelConfigs,
  )

  const thunkedSendOffer = sendOffer({
    channelInfos,
    receiverId,
    rtc,
    send: wsSend(ws),
  })

  rtc.onicecandidate = onIceCandidate(thunkedSendOffer)

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

  R.pipe(
    R.map(R.pipe(
      plumbChannelConfig({
        onData,
        onClose,
      }),
      setUpChannel(rtc),
    )),
    R.bind(Promise.all, Promise),
  )(channelConfigs)
    .then(R.pipe(
      R.tap(() => {
        ws.close() // No longer needed after signaling
        deferDeath()
      }),
      hoistInternal,
      ([internal, externals]) => {
        internalChannel = internal
        return externals
      },
      packageChannels(channelInfos),
      mappify('name'),
      rtcMapSend,
      resolve,
    ))
})

module.exports = init
