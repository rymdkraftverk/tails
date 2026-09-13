import * as l2 from 'l2'
import playerRepository from '../repository/player'

export const giveLivingPlayersOnePoint = () => {
  playerRepository.incrementScores(
    l2
      .getByLabel('player')
      .filter(({ alive }) => alive)
      .map(({ id }) => id),
  )
}
