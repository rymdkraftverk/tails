import React from 'react'
import styled, { keyframes } from 'styled-components/macro'
import Div100vh from 'react-div-100vh'

const spin = keyframes`
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
`

const Spinner = styled(Div100vh)`
  position: absolute;
  left: 50%;
  z-index: 1;
  margin: -75px 0 0 -75px;
  border: 16px solid #f3f3f3;
  border-radius: 50%;
  border-top: 16px solid #3498db;
  width: 120px;
  height: 120px;
  animation: ${spin} 2s linear infinite;
`

const LockerRoomLoader = () => (
  <div>
    <Spinner style={{ top: '50rvh' }} />
  </div>
)

export default LockerRoomLoader
