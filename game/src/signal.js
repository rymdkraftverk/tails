import { merge } from 'rxjs/observable/merge'

const R = require('ramda')
const { Observable: { create } } = require('rxjs/Rx')

const EVENTS = require('../../common/events')

const emit = R.curry((ws, event, payload) => ws.send(JSON.stringify({ event, payload })))

const isEvent = R.curry((eventType, { event }) => R.equals(eventType, event))
const isNewConnection = isEvent(EVENTS.SERVER_OPEN)
const isNewGameCode = isEvent(EVENTS.CREATED)
const isOffer = isEvent(EVENTS.OFFER)
const isControllerCandidate = isEvent(EVENTS.CONTROLLER_CANDIDATE)

const constructMessagesObservable = ws =>
  create((observable) => {
    /* eslint-disable-next-line  no-param-reassign */
    ws.onopen = () => observable.next({ event: EVENTS.SERVER_OPEN, payload: {} })
    /* eslint-disable-next-line  no-param-reassign */
    ws.onmessage = message => observable.next(JSON.parse(message.data))
  }).share()

const constructSignaler = emitter => ({
  sendAnswer:        emitter(EVENTS.ANSWER),
  sendGameCandidate: emitter(EVENTS.GAME_CANDIDATE),
})

const constructGameSignals = messages =>
  create(observable => messages.filter(isNewGameCode).subscribe(observable.next))

const constructSignals = messages =>
  merge(messages.filter(isOffer), messages.filter(isControllerCandidate))

module.exports = ({ address }) => {
  const ws = new WebSocket(address)
  const emitter = emit(ws)
  const messages = constructMessagesObservable(ws)

  /* eslint-disable-next-line no-console */
  messages.subscribe(data => console.log('messages listener:', data))

  messages
    .filter(isNewConnection)
    .subscribe(() => emitter(EVENTS.CREATE, {}))

  return {
    signals:     constructSignals(messages),
    signaler:    constructSignaler(emitter),
    gameSignals: constructGameSignals(messages),
  }
}

