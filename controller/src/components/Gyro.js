import PropTypes from 'prop-types'
import { Event } from 'common'
import useOrientation from '../hook/useOrientation'

// 18 degrees angle = 3 degrees turn rate (max)
const handleOrientation = ({ enabled, send, setAngle }) => ({ beta }) => {
  if (!enabled) return

  const zoomedOutBeta = beta / 6 // between -30 and +30 instead of -180 and +180
  send({
    event: Event.PLAYER_MOVEMENT,
    payload: zoomedOutBeta,
  })

  setAngle(beta)
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
