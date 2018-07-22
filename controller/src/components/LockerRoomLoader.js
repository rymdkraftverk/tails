import React from 'react'
import styled from 'styled-components'

const Container = styled.div`
  touch-action: manipulation;
`
const Spinner = styled.div`
  position: absolute;
  left: 50%;
  top: 50%;
  z-index: 1;
  width: 150px;
  height: 150px;
  margin: -75px 0 0 -75px;
  border: 16px solid #f3f3f3;
  border-radius: 50%;
  border-top: 16px solid #3498db;
  width: 120px;
  height: 120px;
  -webkit-animation: spin 2s linear infinite;
  animation: spin 2s linear infinite;
  touch-action: manipulation;
`

const LockerRoomLoader = () => (
  <Container>
    <Spinner />
  </Container>
)

export default LockerRoomLoader
