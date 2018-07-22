import React from 'react'
import ReactDOM from 'react-dom'
import styled, { injectGlobal } from 'styled-components'
import './index.css'
import App from './components/App'
import registerServiceWorker from './registerServiceWorker'

const AppStyled = styled(App)`
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
`

ReactDOM.render(<AppStyled />, document.getElementById('root'))
registerServiceWorker()
