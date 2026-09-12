import * as l1 from '../l1'
import playerRepository from '../repository/player'

export const giveLivingPlayersOnePoint = () => {
  playerRepository.incrementScores(
    l1
      .getByLabel('player')
      .filter(({ alive }) => alive)
      .map(({ id }) => id),
  )
}
