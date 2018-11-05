import React from 'react'
import * as R from 'ramda'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import IOSDisableDoubleTap from './IOSDisableDoubleTap'

const Container = styled(IOSDisableDoubleTap)`
  display: flex;
  flex-direction: column;
  height: 100vh;
  user-select: none;
  background: ${R.prop('color')};
`

const Text = styled.b`
  height: 30vh;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
`

const noop = () => {}

navigator.vibrate = (navigator.vibrate ||
  navigator.webkitVibrate ||
  navigator.mozVibrate ||
  navigator.msVibrate || noop)

const PlayerDead = ({ playerColor }) => {
  navigator.vibrate(100)
  return (
    <Container
      color={playerColor}
    >
      <Text>{'You\'re dead'}</Text>
    </Container>
  )
}

PlayerDead.propTypes = {
  playerColor: PropTypes.string.isRequired,
}

export default PlayerDead
