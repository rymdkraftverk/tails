import { EVENTS, prettyId } from 'common'

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
  onControllerJoin:  null,
  onControllerLeave: null,
}

let controllers = []
// end state

const getController = id => controllers.find(x => x.id === id)
const removeController = (id) => {
  controllers = controllers.filter(c => c.id !== id)
}

const emit = (event, payload) => {
  const message = JSON.stringify({ event, payload })
  ws.send(message)
}

const onIceCandidate = controller => ({ candidate }) => {
  if (!candidate) {
    log(`[Ice Candidate] ${prettyId(controller.id)} Last candidate retrieved`)
    return
  }

  log(`[Ice Candidate] ${prettyId(controller.id)} ${candidate}`)
  emit(EVENTS.WS.GAME_CANDIDATE, { candidate, controllerId: controller.id })
}

const onDataChannel = controller => ({ channel }) => {
  log(`[Data Channel] ${prettyId(controller.id)} ${channel}`)

  channel.onopen = () => {
    outputEvents.onControllerJoin({
      id:       controller.id,
      setOnData: (onData) => {
        channel.onmessage = ({ data }) => {
          onData(JSON.parse(data))
        }
      },
      send: (data) => {
        channel.send(JSON.stringify(data))
      },
      close: controller.rtc.close,
    })

    removeController(controller.id)
  }

  channel.onclose = () => {
    outputEvents.onControllerLeave(controller.id)
  }
}

const createController = (controllerId, offer) => ({
  id:  controllerId,
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

// First point of contact from controller
const onOffer = ({ controllerId, offer }) => {
  log(`[Offer] ${prettyId(controllerId)} (${offer})`)

  const controller = createController(controllerId, offer)
  controllers.push(controller)
  const { rtc } = controller

  // Start collecting game candidates to be send to this controller
  rtc.onicecandidate = onIceCandidate(controller)
  rtc.ondatachannel = onDataChannel(controller)

  createAnswer(rtc, offer).then((answer) => {
    emit(EVENTS.WS.ANSWER, { answer, controllerId })
  })
}

const onControllerCandidate = ({ controllerId, candidate }) => {
  const controller = getController(controllerId)
  controller.rtc.addIceCandidate(new RTCIceCandidate(candidate))
}

const wsEvents = {
  [EVENTS.WS.OFFER]:                onOffer,
  [EVENTS.WS.CONTROLLER_CANDIDATE]: onControllerCandidate,
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
  wsAdress,
  gameCode,
  onControllerJoin,
  onControllerLeave,
}) => {
  outputEvents.onControllerJoin = onControllerJoin
  outputEvents.onControllerLeave = onControllerLeave

  ws = new WebSocket(wsAdress)
  ws.onopen = () => { emit(EVENTS.WS.GAME_UPGRADE, gameCode) }
  ws.onmessage = onWsMessage
}

export default init
