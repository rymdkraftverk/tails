import * as l1 from 'l1'
import gameState from '../gameState'

export const giveLivingPlayersOnePoint = () => {
  const livingPlayers = l1
    .getByLabel('player')
    .filter(p => p && !p.killed)

  const livingIDs = new Set(livingPlayers.map(p => p.playerId))

  gameState.players = gameState
    .players
    .map(player => (livingIDs.has(player.playerId)
      ? ({
        ...player,
        score: player.score + 1,
      })
      : player))
}
