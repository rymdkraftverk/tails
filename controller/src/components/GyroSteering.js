import React from 'react'
import styled from 'styled-components/macro'

const Container = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  font-size: 5vw;
`

const GyroSteering = props => {
  return <Container>Tilt phone to steer!</Container>
}

export default GyroSteering
