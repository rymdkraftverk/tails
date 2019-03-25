import { useEffect, useRef } from 'react'

export default callback => {
  const savedCallback = useRef()

  // Remember the latest callback
  useEffect(() => {
    savedCallback.current = callback
  }, [callback])

  // Set up event listener
  useEffect(() => {
    const handleOrientation = e => {
      savedCallback.current(e)
    }
    window.addEventListener('deviceorientation', handleOrientation, true)
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation, true)
    }
  }, [])
}
