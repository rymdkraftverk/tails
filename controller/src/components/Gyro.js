import { useEffect } from 'react'
import PropTypes from 'prop-types'
import { Event } from 'common'

const handleOrientation = (enabled, send) => ({ beta }) => {
  if (!enabled) return

  send({
    event: Event.PLAYER_MOVEMENT,
    payload: beta / 6,
  })
}

const Gyro = ({ enabled, send }) => {
  useEffect(() => {
    window.addEventListener('deviceorientation', handleOrientation(enabled, send), true)
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation(enabled, send), true)
    }
  }, [enabled, send])

  return (
    null
  )
}

Gyro.propTypes = {
  enabled: PropTypes.bool.isRequired,
  send: PropTypes.func.isRequired
}

export default Gyro
