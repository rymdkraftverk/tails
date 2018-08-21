const Event = require('./Event')

const WEB_RTC_CONFIG = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
}
const WEB_RTC_CHANNEL_NAME = 'data.channel'

// "udpLike" as described in:
// https://jameshfisher.com/2017/01/17/webrtc-datachannel-reliability.html
const WEB_RTC_CHANNEL_CONFIG = {
  ordered:        false,
  maxRetransmits: 0,
}

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
  emit(Event.INITIATOR_CANDIDATE, { receiverId, candidate })
}

const onError = () => {
  error('WebRTC error')
  cleanUp()
}

const onChannelOpen = () => {
  log(`[Data channel opened] ${rtcChannel}`)
  outputEvents.onSuccess({
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
  [Event.ANSWER]:             onAnswer,
  [Event.RECEIVER_CANDIDATE]: onReceiverCandidate,
  [Event.NOT_FOUND]:          onReceiverNotFound,
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

  outputEvents.onSuccess = resolve
  outputEvents.onFailure = reject

  ws = new WebSocket(wsAddress)
  ws.onmessage = onWsMessage
  ws.onopen = () => {
    createOffer()
      .then(([offer]) => {
        emit(Event.OFFER, { receiverId, offer })
      })
  }

  rtc = new RTCPeerConnection(WEB_RTC_CONFIG)
  rtcChannel = rtc.createDataChannel(
    WEB_RTC_CHANNEL_NAME,
    WEB_RTC_CHANNEL_CONFIG,
  )
  rtcChannel.onopen = onChannelOpen
  rtcChannel.onerror = onError
  rtcChannel.onmessage = ({ data }) => {
    onData(JSON.parse(data))
  }
  rtcChannel.onclose = () => {
    warn('RTC connection closed')
    onClose()
  }

  rtc.onicecandidate = onIceCandidate
})

module.exports = init
