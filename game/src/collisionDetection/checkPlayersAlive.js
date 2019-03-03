import * as l1 from 'l1'
import { State, state } from '../state'
import { transitionToRoundEnd } from '../roundEnd'
import GameEvent from '../constant/gameEvent'

const checkPlayersAlive = () => {
  const playersAlive = l1
    .getByLabel('player')
    .filter(p => p.alive)

  if (playersAlive.length === 1 && state.state === State.PLAYING_ROUND) {
    state.lastRoundResult.winner = playersAlive[0].color

    state
      .eventEmitter
      .emit(GameEvent.ROUND_END)

    transitionToRoundEnd()
  }
}

export default checkPlayersAlive
