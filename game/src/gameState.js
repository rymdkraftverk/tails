import { EventEmitter } from 'eventemitter3'
import { Color } from 'common'

const gameState = {
  started:                        false,
  playingRound:                   false,
  gameCode:                       '',
  hasReceivedControllerCandidate: false,
  // TODO: change to array
  controllers:                    {
  },
  players: {
  },
  lastRoundResult: {
    playerFinishOrder: [],
    winner:            null,
  },
  events:          new EventEmitter(),
  availableColors: Object.keys(Color),
}

export default gameState
