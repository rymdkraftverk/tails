const R = require('ramda')
const Event = require('./Event')
const Channel = require('./channel')

const ReadyState = {
  OPEN: 'open',
}

const WEB_RTC_CONFIG = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
}

const { error, log, warn } = console

// state
let ws
let rtc

let receiverId

let onFailure

// io
const emit = (event, payload) => {
  const message = JSON.stringify({ event, payload })
  ws.send(message)
}

const closeConnections = () => {
  ws.close()
  rtc.close()
}

const onIceCandidate = ({ candidate }) => {
  if (candidate) {
    log('[Ice Candidate]')
    return
  }

  log('[Sending offer] Last candidate retrieved')
  emit(Event.OFFER, { receiverId, offer: rtc.localDescription })
}

const createOffer = () => rtc
  .createOffer()
  .then(offer => Promise.all([offer, rtc.setLocalDescription(offer)]))

const onAnswer = ({ answer }) => rtc
  .setRemoteDescription(answer)

const onReceiverNotFound = () => {
  warn('Reciver not found')
  closeConnections()
  onFailure({ cause: 'NOT_FOUND' })
}

const sendJsonOverChannel = (channel, data) => {
  if (channel.readyState === ReadyState.OPEN) {
    R.pipe(
      JSON.stringify,
      channel.send.bind(channel),
    )(data)
  } else {
    warn(`Attempt to send ${data} to closed channel ${channel.label}`)
  }
}

const setUpChannel = ({
  name, config, onClose, onData,
}) => {
  const channel = rtc.createDataChannel(
    name,
    config,
  )

  channel.onerror = R.pipe(
    error.bind(null, 'WebRTC error'),
    closeConnections,
  )

  channel.onclose = R.pipe(
    warn.bind(null, 'RTC connection closed'),
    onClose,
  )

  channel.onmessage = R.pipe(
    ({ data }) => data,
    JSON.parse,
    onData,
  )

  // Channel considered "set up" once it's opened
  return new Promise((resolve) => {
    channel.onopen = () => {
      log(`[Data channel] ${channel.label}`)
      resolve(channel)
    }
  })
}

const wsEvents = {
  [Event.ANSWER]:    onAnswer,
  [Event.NOT_FOUND]: onReceiverNotFound,
}

const onWsMessage = (message) => {
  const { event, payload } = JSON.parse(message.data)
  const f = wsEvents[event]
  if (!f) {
    warn(`Unhandled event for message: ${message.data}`)
    return
  }
  f(payload)
}

const init = options => new Promise((resolve, reject) => {
  ({ receiverId } = options)

  const {
    wsAddress,
    onData,
    onClose,
  } = options

  onFailure = reject

  ws = new WebSocket(wsAddress)
  ws.onmessage = onWsMessage
  ws.onopen = createOffer

  rtc = new RTCPeerConnection(WEB_RTC_CONFIG)
  rtc.onicecandidate = onIceCandidate

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

  const promisedChannels = channelConfigs
    .map(setUpChannel)

  Promise.all(promisedChannels)
    .then((channels) => {
      const channelMap = channels
        .map(channel => ({ [channel.label]: channel }))
        .reduce(R.merge)

      resolve(channelName => (data) => {
        const channel = channelMap[channelName]
        sendJsonOverChannel(channel, data)
      })
    })
})

module.exports = init
