import { useEffect } from 'react'

const preventDefault = (e) => {
  e.preventDefault()
}

// This component should be rendered on every page that needs to lock orientation

const ScrollLock = props => {
  useEffect(() => {
    
    setTimeout(() => {
      window.scrollTo(0, -1000)
      // This timeout is the lowest number that worked on iOS Safari
    }, 290);
    
    // Prevent scrolling and two finger zoom on iOS
      document.addEventListener(
        'touchmove',
        preventDefault,
        { passive: false },
        )
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

export default ScrollLock
