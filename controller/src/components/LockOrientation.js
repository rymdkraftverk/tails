import { useEffect } from 'react'

const preventDefault = (e) => {
  e.preventDefault()
}

// This component should be rendered on every page that needs to lock orientation

// The timeouts used in this file are from trial and error in iOS Safari

const LockOrientation = props => {
  useEffect(() => {
    
    // Prevent scrolling and two finger zoom on iOS
    setTimeout(() => {
      window.scrollTo(0, -1000)
    }, 290);

    setTimeout(() => {
      document.addEventListener(
        'touchmove',
        preventDefault,
        { passive: false },
        )
    }, 100);
    return () => {
      document.removeEventListener(
        'touchmove',
        preventDefault,
        { passive: false },
      ) 
    }
  }, [])

  return (
    null
  )
}

export default LockOrientation
