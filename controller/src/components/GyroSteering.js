import React from 'react'
import PropTypes from 'prop-types'
import styled from 'styled-components/macro'

const Container = styled.div`
  align-items: center;
  display: flex;
  flex-direction: column;
  height: 100%;
  justify-content: center;
  font-size: 5vw;
`

const GyroSteering = ({ angle }) => {
  return <Container>Tilt phone to steer! {angle}</Container>
}

GyroSteering.propTypes = {
  angle: PropTypes.number.isRequired,
}

export default GyroSteering
