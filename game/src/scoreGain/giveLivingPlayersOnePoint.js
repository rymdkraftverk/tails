import * as l1 from 'l1'
import gameState from '../gameState'

export const giveLivingPlayersOnePoint = () => {
  const livingPlayers = l1
    .getByLabel('player')
    .filter(p => p && p.alive)

  const livingIDs = new Set(livingPlayers.map(p => p.id))

  gameState.players = gameState
    .players
    .map(player => (livingIDs.has(player.id)
      ? ({
        ...player,
        score: player.score + 1,
      })
      : player))
}
