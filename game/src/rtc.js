const R = require('ramda')
const Rx = require('rxjs/Rx')
const EVENTS = require('../../common/events')

const RTC_CONFIG = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
}

const isOfferEvent = R.curry(({ event }) => event === EVENTS.OFFER)

const isControllerCandidateEvent = R.curry(({ event }) => event === EVENTS.CONTROLLER_CANDIDATE)

const isOutOfCandidates = R.curry(({ candidate }) => candidate === undefined || candidate === null)

const constructCandidateObservable = R.curry((rtc, observable) => {
  /* eslint-disable-next-line no-param-reassign */
  rtc.onicecandidate = rtcEvent =>
    (isOutOfCandidates(rtcEvent)
      ? observable.onComplete()
      : observable.onNext(rtcEvent.candidate))
})

const onICECandidate =
  R.curry((controllerId, sendCandidate, { candidate }) => sendCandidate({
    candidate,
    controllerId,
  }))

const setLocalDescriptor = R.curry((rtc, answer) => {
  rtc.setLocalDescription(answer)
  return answer
})

const convertOfferToAnswer = R.curry((rtc, offer) => rtc
  .setRemoteDescription(new RTCSessionDescription(offer))
  .then(() => rtc.createAnswer())
  .then(setLocalDescriptor(rtc)))

const handleControllerCandidate =
  R.curry((rtc, candidate) => rtc.addIceCandidate(new RTCIceCandidate(candidate)))

const handleOffer = R.curry((connectionObserver, signaler, signals, { offer, controllerId }) => {
  console.log('handleOffer => payload:', { offer, controllerId })

  const rtc = new RTCPeerConnection(RTC_CONFIG)

  Rx
    .Observable
    .create(constructCandidateObservable(rtc))
    .subscribe(onICECandidate(controllerId, signaler.sendCandidate))

  /*
   Same procedure as above for 'onDataChannel' but this should use connectionObserver to notify about the new client
   */

  signals
    .filter(isControllerCandidateEvent)
    .subscribe(handleControllerCandidate(rtc))

  convertOfferToAnswer(rtc, offer)
    .then(signaler.sendAnswer)
})

const observableConstructor = R.curry((signaler, signals, connectionObserver) => {
  signals
    .filter(isOfferEvent)
    .subscribe(handleOffer(connectionObserver, signaler, signals))

  return connectionObserver
})

const createReceiver =
  R.curry((signaler, signals) => Rx.Observable.create(observableConstructor(signaler, signals)))

module.exports = {
  createReceiver,
}
