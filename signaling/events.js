const EVENTS = {
  ANSWER:              'receiver.join.answer',
  INITIATOR_CANDIDATE: 'receiver.join.initiator.candidate',
  RECEIVER_CANDIDATE:  'receiver.join.receiver.candidate',
  RECEIVER_UPGRADE:    'receiver.upgrade',
  OFFER:               'receiver.join.offer',
  NOT_FOUND:           'receiver.join.initiator.notfound',
}

module.exports = EVENTS
