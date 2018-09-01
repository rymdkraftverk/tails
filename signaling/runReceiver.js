const R = require('ramda')
const { prettyId } = require('common')
const Event = require('./Event')
const Channel = require('./channel')
const {
  WEB_RTC_CONFIG,
  makeOnMessage,
  makeRtcSend,
  makeWsSend,
  onWsMessage,
} = require('./common')

const { log } = console

// state
let wsSend = null

const outputEvents = {
  onInitiatorJoin:  null,
  onInitiatorLeave: null,
}

let initiators = []
// end state

const removeInitiator = (id) => {
  initiators = initiators.filter(c => c.id !== id)
}

const onIceCandidate = initiator => ({ candidate }) => {
  if (candidate) {
    log(`[Ice Candidate] ${prettyId(initiator.id)}`)
    return
  }

  log(`[Sending answer] ${prettyId(initiator.id)} Last candidate retrieved`)
  wsSend(Event.ANSWER, { answer: initiator.rtc.localDescription, initiatorId: initiator.id })
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

const makeSetOnData = channels => (onData) => {
  channels.forEach((channel) => {
    channel.onmessage = makeOnMessage(onData)
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
  setUpChannels(rtc, Object.values(Channel), initiator)
    .then((channels) => {
      outputEvents.onInitiatorJoin({
        id:        initiator.id,
        setOnData: makeSetOnData(channels),
        send:      makeRtcSend(channels),
        close:     rtc.close.bind(rtc),
      })

      removeInitiator(initiator.id)
    })

  createAnswer(rtc, offer)
}

const init = ({
  wsAddress,
  receiverId,
  onInitiatorJoin,
  onInitiatorLeave,
}) => {
  outputEvents.onInitiatorJoin = onInitiatorJoin
  outputEvents.onInitiatorLeave = onInitiatorLeave

  const ws = new WebSocket(wsAddress)
  wsSend = makeWsSend(ws)
  ws.onopen = () => { wsSend(Event.RECEIVER_UPGRADE, receiverId) }
  ws.onmessage = onWsMessage({
    [Event.OFFER]: onOffer,
  })
}

module.exports = init
