import React from 'react'
import ReactDOM from 'react-dom'
import styled, { injectGlobal } from 'styled-components'
import App from './components/App'
import registerServiceWorker from './registerServiceWorker'

const StyledApp = styled(App)`
  touch-action: manipulation;
`

/* eslint-disable-next-line no-unused-expressions */
injectGlobal`
  @font-face {
    font-family: 'patchy-robots';
    src: url('patchy-robots.ttf');
  }
  
  html {
    touch-action: manipulation;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'patchy-robots';
    background: #414844;
    margin: 0px;
    touch-action: manipulation;
  }

  button {
    letter-spacing: 0.1em;
    font-size: 8vw;
    border: none;
    background: transparent;
    color: #4085AF;
    font-family:'patchy-robots';
    border: 0.1em solid #4085AF;
    border-radius: 0.12em;
    box-shadow: 0.1em 0.1em;
    transition: all ease 0.05s;
    position: relative;
    top: 0rem;
    left: 0rem;
  }

  button:active {
    box-shadow: 0rem 0rem;
    top: 0.1em;
    left: 0.1em;
  }
`

ReactDOM.render(<StyledApp />, document.getElementById('root'))
registerServiceWorker()
