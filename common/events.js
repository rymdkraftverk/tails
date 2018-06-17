const EVENTS = {
  WS: {
    ANSWER:                'game.join.answer',
    CONTROLLER_CANDIDATE:  'game.join.controller.candidate',
    CREATED:               'game.created',
    GAME_CANDIDATE:        'game.join.game.candidate',
    GAME_UPGRADE:          'game.upgrade',
    OFFER:                 'game.join.offer',
  },
  RTC: {
    GAME_OVER:             'game.over',
    GAME_START:            'game.start',
    GAME_STARTED:          'game.started',
    PLAYER_JOINED:         'player.joined',
    PLAYER_MOVEMENT:       'player.movement',
  }
}

module.exports = EVENTS;
