const EVENTS = {
  // TODO: Move WS events into signaling module
  WS: {
    ANSWER:              'receiver.join.answer',
    INITIATOR_CANDIDATE: 'receiver.join.initiator.candidate',
    RECEIVER_CANDIDATE:  'receiver.join.receiver.candidate',
    RECEIVER_UPGRADE:    'receiver.upgrade',
    OFFER:               'receiver.join.offer',
    NOT_FOUND:           'receiver.join.initiator.notfound',
  },
  RTC: {
    ROUND_END:        'round.end',
    ROUND_START:      'round.start',
    ROUND_STARTED:    'round.started',
    PLAYER_JOINED:   'player.joined',
    PLAYER_MOVEMENT: 'player.movement',
  }
}

module.exports = EVENTS;
