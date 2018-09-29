const R = require('ramda')
const Event = require('./event')
const {
  INTERNAL_CHANNEL,
  WEB_RTC_CONFIG,
  makeCloseConnections,
  makeOnMessage,
  mappify,
  onWsMessage,
  partitionInternal,
  prettyId,
  rtcMapSend,
  rtcSend,
  warnNotFound,
  wsSend,
} = require('./common')

const { error, log, warn } = console

// state
let closeConnections = null
let internalChannel
let id = null
// end state

const onInternalData = ({ event }) => {
  if (event !== Event.HEARTBEAT) {
    warn(`Unhandled internal event ${event}`)
    return
  }

  rtcSend(
    internalChannel,
    { event: Event.HEARTBEAT, payload: id },
  )
}

const onIceCandidate = ({
  channelNames,
  receiverId,
  rtc,
  send,
}) => ({ candidate }) => {
  if (candidate) {
    log('[Ice Candidate]')
    return
  }

  log('[Sending offer] Last candidate retrieved')
  send(
    Event.OFFER,
    {
      channelNames,
      offer: rtc.localDescription,
      receiverId,
    },
  )
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

const plumChannelConfig = external => R.ifElse(
  R.equals(INTERNAL_CHANNEL),
  R.merge({
    onData:  onInternalData,
    onClose: () => warn('Internal channel closed'),
  }),
  R.merge(external),
)

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

  channel.onmessage = makeOnMessage(onData)

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

  rtc.onicecandidate = onIceCandidate({
    channelNames: R.pluck('name', channelConfigs),
    receiverId,
    rtc,
    send:         wsSend(ws),
  })

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
      plumChannelConfig({
        onData,
        onClose,
      }),
      setUpChannel(rtc),
    )),
    R.bind(Promise.all, Promise),
  )(channelConfigs)
    .then(R.pipe(
      partitionInternal,
      ([internal, externals]) => {
        internalChannel = internal
        return externals
      },
      mappify('label'),
      rtcMapSend,
      resolve,
    ))
})

module.exports = init
