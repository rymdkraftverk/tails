import { EventEmitter } from 'eventemitter3'

const gameState = {
  started:                        false,
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
  events: new EventEmitter(),
}

export default gameState
