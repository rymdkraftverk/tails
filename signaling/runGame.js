const { prettyId } = require('common')
const EVENTS = require('./events')

const WEB_RTC_CONFIG = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
}

const { log, warn } = console

// state
let ws

const outputEvents = {
  onInitiatorJoin:  null,
  onInitiatorLeave: null,
}

let initiators = []
// end state

const getInitiator = id => initiators.find(x => x.id === id)

const removeInitiator = (id) => {
  initiators = initiators.filter(c => c.id !== id)
}

const emit = (event, payload) => {
  const message = JSON.stringify({ event, payload })
  ws.send(message)
}

const onIceCandidate = initiator => ({ candidate }) => {
  if (!candidate) {
    log(`[Ice Candidate] ${prettyId(initiator.id)} Last candidate retrieved`)
    return
  }

  log(`[Ice Candidate] ${prettyId(initiator.id)} ${candidate}`)
  emit(EVENTS.RECEIVER_CANDIDATE, { candidate, initiatorId: initiator.id })
}

const onDataChannel = initiator => ({ channel }) => {
  log(`[Data Channel] ${prettyId(initiator.id)} ${channel}`)

  channel.onopen = () => {
    outputEvents.onInitiatorJoin({
      id:        initiator.id,
      setOnData: (onData) => {
        channel.onmessage = ({ data }) => {
          onData(JSON.parse(data))
        }
      },
      send: (data) => {
        channel.send(JSON.stringify(data))
      },
      close: initiator.rtc.close,
    })

    removeInitiator(initiator.id)
  }

  channel.onclose = () => {
    outputEvents.onInitiatorLeave(initiator.id)
  }
}

const createInitiator = (initiatorId, offer) => ({
  id:  initiatorId,
  offer,
  rtc: new RTCPeerConnection(WEB_RTC_CONFIG),
})

const createAnswer = (rtc, offer) => rtc
  .setRemoteDescription(new RTCSessionDescription(offer))
  .then(() => rtc.createAnswer())
  .then((answer) => {
    rtc.setLocalDescription(answer)
    return answer
  })

// First point of contact from initiator
const onOffer = ({ initiatorId, offer }) => {
  log(`[Offer] ${prettyId(initiatorId)} (${offer})`)

  const initiator = createInitiator(initiatorId, offer)
  initiators = initiator.concat(initiator)
  const { rtc } = initiator

  // Start collecting receiver candidates to be send to this initiator
  rtc.onicecandidate = onIceCandidate(initiator)
  rtc.ondatachannel = onDataChannel(initiator)

  createAnswer(rtc, offer)
    .then((answer) => {
      emit(EVENTS.ANSWER, { answer, initiatorId })
    })
}

const onInitiatorCandidate = ({ initiatorId, candidate }) => {
  const initiator = getInitiator(initiatorId)
  initiator.rtc.addIceCandidate(new RTCIceCandidate(candidate))
}

const wsEvents = {
  [EVENTS.OFFER]:               onOffer,
  [EVENTS.INITIATOR_CANDIDATE]: onInitiatorCandidate,
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

const init = ({
  wsAddress,
  receiverId,
  onInitiatorJoin,
  onInitiatorLeave,
}) => {
  outputEvents.onInitiatorJoin = onInitiatorJoin
  outputEvents.onInitiatorLeave = onInitiatorLeave

  ws = new WebSocket(wsAddress)
  ws.onopen = () => { emit(EVENTS.RECEIVER_UPGRADE, receiverId) }
  ws.onmessage = onWsMessage
}

module.exports = init
