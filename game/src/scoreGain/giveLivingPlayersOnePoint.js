import R from 'ramda'
import * as l1 from 'l1'
import playerRepository from '../repository/player'

const incAliveScores = R.pipe(
  R.filter(R.propEq('alive', true)),
  R.pluck('id'),
  playerRepository.incScores,
)

export const giveLivingPlayersOnePoint = () => {
  incAliveScores(l1.getByLabel('player'))
}
