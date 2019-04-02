import PropTypes from 'prop-types'
import { Event } from 'common'
import useOrientation from '../hook/useOrientation'
import * as R from 'ramda'

const MAX_ANGLE = 18
const MIN_ANGLE = -MAX_ANGLE

// 18 degrees angle = 3 degrees turn rate (max)
const handleOrientation = ({ enabled, send, setAngle }) => ({ beta }) => {
  if (!enabled) return

  const zoomedOutBeta = beta / 6 // between -30 and +30 instead of -180 and +180
  send({
    event: Event.PLAYER_MOVEMENT,
    payload: zoomedOutBeta,
  })

  // Need to be synced with throttling in game/src/game.js
  const throttledBeta = R.clamp(MIN_ANGLE, MAX_ANGLE, beta)
  setAngle(throttledBeta)
}

const Gyro = props => {
  useOrientation(handleOrientation(props))

  return null
}

Gyro.propTypes = {
  enabled: PropTypes.bool.isRequired,
  send: PropTypes.func.isRequired,
  setAngle: PropTypes.func.isRequired,
}

export default Gyro
