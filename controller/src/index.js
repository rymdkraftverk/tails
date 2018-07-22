import React from 'react'
import ReactDOM from 'react-dom'
import styled from 'styled-components'
import './index.css'
import App from './components/App'
import registerServiceWorker from './registerServiceWorker'

const AppStyled = styled(App)`
  touch-action: manipulation;
`

ReactDOM.render(<AppStyled />, document.getElementById('root'))
registerServiceWorker()
