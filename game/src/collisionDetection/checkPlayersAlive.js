import * as l1 from 'l1'
import gameState, { CurrentState } from '../gameState'
import { transitionToRoundEnd } from '../roundEnd'
import GameEvent from '../constant/gameEvent'

const checkPlayersAlive = () => {
  const playersAlive = l1
    .getByLabel('player')
    .filter(p => !p.killed)

  if (playersAlive.length === 1 && gameState.currentState === CurrentState.PLAYING_ROUND) {
    gameState.lastRoundResult.winner = playersAlive[0].color
    gameState.lastRoundResult.playerFinishOrder =
            gameState.lastRoundResult.playerFinishOrder.concat([playersAlive[0].l1.id])

    gameState
      .events
      .emit(GameEvent.ROUND_END)

    transitionToRoundEnd()
  }
}

export default checkPlayersAlive
