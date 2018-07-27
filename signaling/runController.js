const EVENTS = require('./events')

const WEB_RTC_CONFIG = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
}
const WEB_RTC_CHANNEL_NAME = 'data.channel'

const { error, log, warn } = console

// state
let ws
let rtc
let rtcChannel

let receiverId

const outputEvents = {
  onSuccess: null,
  onFailure: null,
}

// io
const emit = (event, payload) => {
  const message = JSON.stringify({ event, payload })
  ws.send(message)
}

const cleanUp = () => {
  ws.close()
  rtc.close()
}

const onIceCandidate = ({ candidate }) => {
  if (!candidate) {
    log('[Ice Candidate] Last candidate retrieved')
    return
  }

  log(`[Ice Candidate] ${candidate}`)
  emit(EVENTS.INITIATOR_CANDIDATE, { receiverId, candidate })
}

const onError = () => {
  error('WebRTC error')
  cleanUp()
}

const onChannelOpen = () => {
  log(`[Data channel opened] ${rtcChannel}`)
  outputEvents.onSuccess({
    setOnData: (onData) => {
      rtcChannel.onmessage = ({ data }) => {
        onData(JSON.parse(data))
      }
    },
    setOnClose: (onClose) => {
      rtcChannel.onclose = () => {
        warn('RTC connection closed')
        onClose()
      }
    },
    send: (data) => {
      rtcChannel.send(JSON.stringify(data))
    },
  })
}

const createOffer = () => rtc
  .createOffer()
  .then(offer => Promise.all([offer, rtc.setLocalDescription(offer)]))

const onAnswer = ({ answer }) => rtc
  .setRemoteDescription(answer)

const onReceiverCandidate = ({ candidate }) => {
  rtc.addIceCandidate(new RTCIceCandidate(candidate))
}

const onReceiverNotFound = () => {
  warn('Reciver not found')
  cleanUp()
  outputEvents.onFailure({ cause: 'NOT_FOUND' })
}

const wsEvents = {
  [EVENTS.ANSWER]:             onAnswer,
  [EVENTS.RECEIVER_CANDIDATE]: onReceiverCandidate,
  [EVENTS.NOT_FOUND]:          onReceiverNotFound,
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

  outputEvents.onSuccess = resolve
  outputEvents.onFailure = reject

  ws = new WebSocket(options.wsAdress)
  ws.onmessage = onWsMessage
  ws.onopen = () => {
    createOffer()
      .then(([offer]) => {
        emit(EVENTS.OFFER, { receiverId, offer })
      })
  }

  rtc = new RTCPeerConnection(WEB_RTC_CONFIG)
  rtcChannel = rtc.createDataChannel(WEB_RTC_CHANNEL_NAME)
  rtcChannel.onopen = onChannelOpen
  rtcChannel.onerror = onError

  rtc.onicecandidate = onIceCandidate
})

module.exports = init
