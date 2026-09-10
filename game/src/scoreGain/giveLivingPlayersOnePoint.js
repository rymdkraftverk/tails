import * as R from 'ramda'
import * as l1 from 'l1'
import playerRepository from '../repository/player'

const incAliveScores = R.pipe(
  R.filter(R.propEq(true, 'alive')),
  R.pluck('id'),
  playerRepository.incrementScores,
)

export const giveLivingPlayersOnePoint = () => {
  incAliveScores(l1.getByLabel('player'))
}
