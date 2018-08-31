const R = require('ramda')
const { prettyId } = require('common')
const Event = require('./Event')
const Channel = require('./channel')

// TODO: common signaling
const ReadyState = {
  OPEN: 'open',
}

// TODO: common signaling
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

const removeInitiator = (id) => {
  initiators = initiators.filter(c => c.id !== id)
}

// TODO: common signaling
const emit = (event, payload) => {
  const message = JSON.stringify({ event, payload })
  ws.send(message)
}

const onIceCandidate = initiator => ({ candidate }) => {
  if (candidate) {
    log(`[Ice Candidate] ${prettyId(initiator.id)}`)
    return
  }

  log(`[Sending answer] ${prettyId(initiator.id)} Last candidate retrieved`)
  emit(Event.ANSWER, { answer: initiator.rtc.localDescription, initiatorId: initiator.id })
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

const setUpChannels = (rtc, channelNames, initiator) => {
  let openChannels = []

  return new Promise((resolve) => {
    rtc.ondatachannel = ({ channel }) => {
      channel.onopen = () => {
        log(`[Data channel] ${prettyId(initiator.id)} ${channel.label}`)
        openChannels = openChannels.concat([channel])

        const allOpened = R.pipe(
          R.pluck('label'),
          R.equals(channelNames),
        )(openChannels)

        if (allOpened) {
          resolve(openChannels)
        }
      }

      channel.onclose = () => {
        outputEvents.onInitiatorLeave(initiator.id)
      }
    }
  })
}

// TODO: common signaling
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

// First point of contact from initiator
const onOffer = ({ initiatorId, offer }) => {
  log(`[Offer] ${prettyId(initiatorId)}`)

  const initiator = createInitiator(initiatorId, offer)
  initiators = initiators.concat(initiator)
  const { rtc } = initiator

  // Start collecting receiver candidates to be sent to this initiator
  rtc.onicecandidate = onIceCandidate(initiator)

  // Wait for both known channels to be opened before considering initiator
  // to have joined
  setUpChannels(rtc, Object.values(Channel), initiator)
    .then((channels) => {
      const channelMap = channels
        .map(channel => ({ [channel.label]: channel }))
        .reduce(R.merge)

      outputEvents.onInitiatorJoin({
        id:        initiator.id,
        setOnData: (onData) => {
          channels.forEach((channel) => {
            channel.onmessage = R.pipe(
              ({ data }) => data,
              JSON.parse,
              onData,
            )
          })
        },
        send: (channelName, data) => {
          const channel = channelMap[channelName]
          sendJsonOverChannel(channel, data)
        },
        close: rtc.close,
      })

      removeInitiator(initiator.id)
    })

  createAnswer(rtc, offer)
}

const wsEvents = {
  [Event.OFFER]: onOffer,
}

// TODO: common signaling
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
  ws.onopen = () => { emit(Event.RECEIVER_UPGRADE, receiverId) }
  ws.onmessage = onWsMessage
}

module.exports = init
