import React from 'react'
import ReactDOM from 'react-dom'
import { injectGlobal } from 'styled-components'
import Boundary from './components/Boundary'
import App from './components/App'

/* eslint-disable-next-line no-unused-expressions */
injectGlobal`
  @font-face {
    font-family: 'patchy-robots';
    src: url('patchy-robots.ttf');
  }
  
  html {
    /* This is needed to prevent double tap zoom on iOS Safari */
    touch-action: manipulation;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'patchy-robots';
    background: #414844;
    height: 100%;
  }

  .fullscreen-enabled {
    background-color: #414844;
  }

  button {
    letter-spacing: 0.1em;
    font-size: 8vw;
    background: transparent;
    font-family: 'patchy-robots';
    border: 0.1em solid #4085af;
    border-radius: 0.12em;
    box-shadow: 0.1em 0.1em;
    transition: all ease 0.05s;
    position: relative;
    top: 0;
    left: 0;
  }

  button:active {
    box-shadow: 0 0;
    top: 0.1em;
    left: 0.1em;
  }
`

// Prevent displaying "undo text" dialog on iOS when device is accidentally shaken
window.addEventListener('devicemotion', (e) => {
  e.preventDefault()
})

// Prevent scrolling and two finger zoom on iOS
document.addEventListener(
  'touchmove',
  (e) => {
    e.preventDefault()
  }, { passive: false },
)

ReactDOM.render(<Boundary><App /></Boundary>, document.getElementById('root'))
