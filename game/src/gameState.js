import { EventEmitter } from 'eventemitter3'

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
