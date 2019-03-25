import PropTypes from 'prop-types'
import { Event } from 'common'
import useOrientation from '../hook/useOrientation';

const handleOrientation = (enabled, send) => ({ beta }) => {
  if (!enabled) return

  send({
    event: Event.PLAYER_MOVEMENT,
    payload: beta / 6,
  })
}

const Gyro = ({ enabled, send }) => {
  useOrientation(handleOrientation(enabled, send));

  return null
}

Gyro.propTypes = {
  enabled: PropTypes.bool.isRequired,
  send: PropTypes.func.isRequired,
}

export default Gyro
