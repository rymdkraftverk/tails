import { Event } from 'common'
import useOrientation from '../hook/useOrientation'

const MAX_ANGLE = 18
const MIN_ANGLE = -MAX_ANGLE

type GyroProps = {
  enabled: boolean
  send: (message: object) => void
  setAngle: (angle: number) => void
}

const clamp = (value: number) => Math.min(Math.max(value, MIN_ANGLE), MAX_ANGLE)

// 18 degrees angle = 3 degrees turn rate (max)
const handleOrientation =
  ({ enabled, send, setAngle }: GyroProps) =>
  ({ beta }: DeviceOrientationEvent) => {
    if (!enabled || beta === null) return

    const zoomedOutBeta = beta / 6 // between -30 and +30 instead of -180 and +180
    send({
      event: Event.PLAYER_MOVEMENT,
      payload: zoomedOutBeta,
    })

    // Need to be synced with throttling in game/src/game.js
    const throttledBeta = clamp(beta)
    setAngle(throttledBeta)
  }

function Gyro({ enabled, send, setAngle }: GyroProps) {
  useOrientation(handleOrientation({ enabled, send, setAngle }))

  return null
}

export default Gyro
