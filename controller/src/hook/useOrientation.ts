import { useEffect, useRef } from 'react'

export default (callback: (event: DeviceOrientationEvent) => void) => {
  const savedCallback = useRef(callback)

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up event listener
  useEffect(() => {
    const handleOrientation = (e: DeviceOrientationEvent) => {
      savedCallback.current(e)
    }
    window.addEventListener('deviceorientation', handleOrientation, true)
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true)
    }
  }, [])
}
