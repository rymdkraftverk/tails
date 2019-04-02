import PropTypes from 'prop-types'
import { Event } from 'common'
import useOrientation from '../hook/useOrientation'

const handleOrientation = ({ enabled, send, setAngle }) => ({ beta }) => {
  if (!enabled) return

  send({
    event: Event.PLAYER_MOVEMENT,
    payload: beta / 6,
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
