const R = require('ramda')
const Event = require('./Event')

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

const sendJsonOverChannel = channel => (data) => {
  channel.send(JSON.stringify(data))
}

// TODO: whynowork?!
// const sendJsonOverChannel = channel => R.compose(
//   channel.send,
//   JSON.stringify,
// )

const setUpChannels = configs =>
  configs.map((c) => {
    const channel = rtc.createDataChannel(c.name, c.config)

    channel.onerror = () => {
      error('WebRTC error')
      closeConnections()
    }

    channel.onclose = () => {
      warn('RTC connection closed')
      c.onClose()
    }

    channel.onmessage = R.compose(
      c.onData,
      JSON.parse,
      ({ data }) => data,
    )

    // Channel considered "set up" once it's opened
    return new Promise((resolve) => {
      channel.onopen = () => {
        log(`[Data channel] ${channel.label}`)
        resolve(channel)
      }
    })
  })


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
    onUnreliableData,
    onReliableData,
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
    name:   'unreliable',
    config: {
      ordered:        false,
      maxRetransmits: 0,
    },
    onData: onUnreliableData,
    onClose,
  },
  {
    // "tcpLike"
    name:   'reliable',
    config: {
      ordered: true,
    },
    onData: onReliableData,
    onClose,
  }]

  // TODO: whynowork?!
  // R.compose(
  //   Promise.all,
  //   setUpChannels,
  // )(channelConfigs)

  Promise.all(setUpChannels(channelConfigs))
    .then(([unreliableChannel, reliableChannel]) => {
      resolve({
        sendUnreliable: sendJsonOverChannel(unreliableChannel),
        sendReliable:   sendJsonOverChannel(reliableChannel),
      })
    })
})

module.exports = init
