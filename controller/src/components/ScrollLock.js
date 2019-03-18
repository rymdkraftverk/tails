import { useEffect } from 'react'

const preventDefault = e => {
  e.preventDefault()
}

// This component should be rendered on every page that needs to lock scroll

const ScrollLock = props => {
  useEffect(() => {
    setTimeout(() => {
      // -1000 is an arbitrary number that definitely scroll to the top
      window.scrollTo(0, -1000)
      // This timeout is the lowest number that worked on iOS Safari. It's enough time for address bar to be visible.
    }, 290)

    // Prevent scrolling and two finger zoom on iOS
    document.addEventListener('touchmove', preventDefault, { passive: false })
    return () => {
      document.removeEventListener('touchmove', preventDefault, {
        passive: false,
      })
    }
  }, [])

  return null
}

export default ScrollLock
