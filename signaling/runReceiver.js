const R = require('ramda')
const Event = require('./Event')
const Channel = require('./channel')
const {
  ReadyState,
  WEB_RTC_CONFIG,
  makeCloseConnections,
  makeOnMessage,
  makeWsSend,
  mappify,
  onWsMessage,
  prettyId,
  rtcSend,
} = require('./common')

const HEARTBEAT_INTERVAL = 1000

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

const getInitiator = id => initiators.find(x => x.id === id)

const getActiveInitiators = R.filter(R.pipe(
  R.view(R.lensPath(['channelMap', Channel.RELIABLE, 'readyState'])),
  R.equals(ReadyState.OPEN),
))

const beatHeart = R.pipe(
  getActiveInitiators,
  R.forEach((initiator) => {
    if (initiator.alive) {
      rtcSend(
        initiator.channelMap,
        Channel.RELIABLE,
        { event: Event.HEARTBEAT },
      )
      initiator.alive = false
      return
    }

    outputEvents.onInitiatorLeave(initiator.id)
    removeInitiator(initiator.id)
    initiator.closeConnections()
  }),
  R.tap(() => setTimeout(
    // Insert fresh initiators into next heartbeat
    () => { beatHeart(initiators) },
    HEARTBEAT_INTERVAL,
  )),
)

const listenForHeartbeat = ({ event, payload: initiatorId }) => {
  const isHeartbeat = event === Event.HEARTBEAT
  if (isHeartbeat) {
    getInitiator(initiatorId).alive = true
  }

  return { interupt: isHeartbeat }
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
  alive: true,
  id:    initiatorId,
  offer,
  rtc:   new RTCPeerConnection(WEB_RTC_CONFIG),
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
    }
  })
}

const makeSetOnData = channels => (onData) => {
  channels.forEach((channel) => {
    channel.onmessage = makeOnMessage([listenForHeartbeat, onData])
  })
}


// First point of contact from initiator
const onOffer = ({ initiatorId, offer }) => {
  log(`[Offer] ${prettyId(initiatorId)}`)

  const initiator = createInitiator(initiatorId, offer)
  initiator.closeConnections = makeCloseConnections([initiator.rtc])
  initiators = initiators.concat(initiator)
  const { rtc } = initiator

  // Start collecting receiver candidates to be sent to this initiator
  rtc.onicecandidate = onIceCandidate(initiator)

  // Wait for both known channels to be opened before considering initiator
  // to have joined
  setUpChannels(rtc, Object.values(Channel), initiator)
    .then((channels) => {
      const channelMap = mappify(channels, 'label')
      getInitiator(initiator.id).channelMap = channelMap

      outputEvents.onInitiatorJoin({
        id:        initiator.id,
        setOnData: makeSetOnData(channels),
        send:      rtcSend(channelMap),
        close:     rtc.close.bind(rtc),
      })
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
    [Event.OFFER]:     onOffer,
    [Event.CLIENT_ID]: R.pipe(prettyId, R.concat('[Id] '), log),
  })
  beatHeart(initiators)
}

module.exports = init
