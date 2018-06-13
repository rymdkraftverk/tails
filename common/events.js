const EVENTS = {
  GAME_UPGRADE:                    'game.upgrade',
  CREATED:                         'game.created',
  GAME_START:                      'game.start',
  GAME_STARTED:                    'game.started',
  GAME_OVER:                       'game.over',
  ANSWER:                          'game.join.answer',
  OFFER:                           'game.join.offer',
  CONTROLLER_CANDIDATE:            'game.join.controller.candidate',
  GAME_CANDIDATE:                  'game.join.game.candidate',
  PLAYER_MOVEMENT:                 'player.movement',
  PLAYER_JOINED:                   'player.joined',
  METRICS_PLAYER_COMMANDS:         'metrics.player.commands',
}

module.exports = EVENTS;
