const R = require('ramda')
const Event = require('./event')
const {
  ReadyState,
  WEB_RTC_CONFIG,
  hoistInternal,
  makeCloseConnections,
  makeOnRtcMessage,
  mappify,
  onWsMessage,
  packageChannels,
  prettyId,
  rtcMapSend,
  rtcSend,
  wsSend,
} = require('./common')

const HEARTBEAT_INTERVAL = 10000

const { log, warn } = console

// state
let send = null

const outputEvents = {
  onInitiatorJoin:  null,
  onInitiatorLeave: null,
}

let initiators = []
// end state

const instantiateInitiator = (initiatorId, offer) => ({
  alive: true,
  id:    initiatorId,
  offer,
  rtc:   new RTCPeerConnection(WEB_RTC_CONFIG),
})

const appendInitiatorMethods = initiator => R.merge(
  initiator,
  {
    closeConnections: makeCloseConnections([initiator.rtc]),
  },
)

const addInitiator = (initiator) => {
  initiators = initiators.concat(initiator)
  return initiator
}

const createInitiator = R.pipe(
  instantiateInitiator,
  appendInitiatorMethods,
  addInitiator,
)

const removeInitiator = (id) => {
  initiators = initiators.filter(c => c.id !== id)
}

const getInitiator = id => initiators.find(x => x.id === id)

const killInitiator = (id) => {
  const initiator = getInitiator(id)
  if (!initiator) return

  initiator.closeConnections()
  outputEvents.onInitiatorLeave(id)
  removeInitiator(id)
}

const isOpen = R.pipe(
  R.view(R.lensPath(['internalChannel', 'readyState'])),
  R.equals(ReadyState.OPEN),
)

const beatHeart = R.pipe(
  R.forEach((initiator) => {
    if (initiator.alive && isOpen(initiator)) {
      rtcSend(
        JSON.stringify,
        initiator.internalChannel,
        { event: Event.HEARTBEAT },
      )
      initiator.alive = false
      return
    }

    killInitiator(initiator.id)
  }),
  R.tap(() => setTimeout(
    // Insert fresh initiators into next heartbeat
    () => { beatHeart(initiators) },
    HEARTBEAT_INTERVAL,
  )),
)

const onInternalData = ({ event, payload: initiatorId }) => {
  if (event !== Event.HEARTBEAT) {
    warn(`Unhandled internal event ${event}`)
    return
  }

  getInitiator(initiatorId).alive = true
}

const onIceCandidate = initiator => ({ candidate }) => {
  if (candidate) {
    log(`[Ice Candidate] ${prettyId(initiator.id)}`)
    return
  }

  log(`[Sending answer] ${prettyId(initiator.id)} Last candidate retrieved`)
  send(Event.ANSWER, { answer: initiator.rtc.localDescription, initiatorId: initiator.id })
}

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
        killInitiator(initiator.id)
      }
    }
  })
}

const makeSetOnData = channels => (onData) => {
  channels.forEach(({ channel, protobuf }) => {
    channel.onmessage = makeOnRtcMessage({
      protobuf,
      onData,
    })
  })
}

const plumbInternalChannel = ({ channel, initiator }) => {
  initiator.internalChannel = channel
  channel.onmessage = makeOnRtcMessage({
    onData: onInternalData,
  })
}

const outputExternalChannels = ({ channels, initiator, rtc }) => {
  const channelMap = mappify('name', channels)

  outputEvents.onInitiatorJoin({
    id:        initiator.id,
    setOnData: makeSetOnData(channels),
    send:      rtcMapSend(channelMap),
    close:     R.bind(rtc.close, rtc),
  })
}

// First point of contact from initiator
const onOffer = ({ initiatorId, channelInfos, offer }) => {
  log(`[Offer] ${prettyId(initiatorId)}`)

  const initiator = createInitiator(initiatorId, offer)
  const { rtc } = initiator

  // Start collecting receiver candidates to be sent to this initiator
  rtc.onicecandidate = onIceCandidate(initiator)

  // Wait for all known channels to be opened before considering initiator
  // to have joined
  const channelNames = R.pluck('name', channelInfos)
  setUpChannels(rtc, channelNames, initiator)
    .then((channels) => {
      const [internal, externals] = hoistInternal(channels)

      plumbInternalChannel({
        channel: internal,
        initiator,
      })

      outputExternalChannels({
        channels: packageChannels(channelInfos, externals),
        initiator,
        rtc,
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
  send = wsSend(ws)
  ws.onopen = () => { send(Event.RECEIVER_UPGRADE, receiverId) }

  ws.onmessage = R.pipe(
    R.prop('data'),
    onWsMessage({
      [Event.OFFER]:     onOffer,
      [Event.CLIENT_ID]: R.pipe(prettyId, R.concat('[Id] '), log),
    }),
  )

  beatHeart(initiators)
}

module.exports = init
