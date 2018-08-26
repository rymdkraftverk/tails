const R = require('ramda')
const { prettyId } = require('common')
const Event = require('./Event')

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

        const allOpened = R.compose(
          R.equals(channelNames),
          R.pluck('label'),
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
  setUpChannels(rtc, ['unreliable', 'reliable'], initiator)
    .then(([unreliableChannel, reliableChannel]) => {
      outputEvents.onInitiatorJoin({
        id:                  initiator.id,
        setOnUnreliableData: (onData) => {
          unreliableChannel.onmessage = R.compose(
            onData,
            JSON.parse,
            ({ data }) => data,
          )
        },
        setOnReliableData: (onData) => {
          reliableChannel.onmessage = R.compose(
            onData,
            JSON.parse,
            ({ data }) => data,
          )
        },
        /*
        Possible readyStates:
        'open':       OK to send
        'connecting': Not OK to send
        'closing':    Not OK to send, but will try to send what's already in the internal queue
        'closed':     Not OK to send
        */
        sendUnreliable: (data) => {
          if (unreliableChannel.readyState === ReadyState.OPEN) {
            R.compose(
              unreliableChannel.send,
              JSON.stringify,
            )(data)
          }
        },
        sendReliable: (data) => {
          if (reliableChannel.readyState === ReadyState.OPEN) {
            reliableChannel.send(JSON.stringify(data))

            // TODO: whynowork?!
            // R.compose(
            //   reliableChannel.send,
            //   JSON.stringify,
            // )(data)
          }
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
