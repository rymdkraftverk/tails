import React from 'react'
import * as R from 'ramda'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import IOSDisableDoubleTap from './IOSDisableDoubleTap'

const Container = styled(IOSDisableDoubleTap)`
  display: flex;
  flex-direction: column;
  justify-content: center;
  height: 100vh;
  user-select: none;
  background: ${R.prop('color')};
  align-items: center;
`

const Text = styled.div`
  font-weight: bold;
`

const Button = styled.button`
  padding: 8px;
  border: 0.1em solid black;
  margin-top: 16px;
`

const noop = () => {}

navigator.vibrate =
  navigator.vibrate ||
  navigator.webkitVibrate ||
  navigator.mozVibrate ||
  navigator.msVibrate ||
  noop

const PlayerDead = ({ playerColor, onClick }) => {
  navigator.vibrate(100)
  return (
    <Container
      color={playerColor}
    >
      <Text>{'You\'re dead'}</Text>
      <Button onClick={onClick}>{'Sparkle!'}</Button>
    </Container>
  )
}

PlayerDead.propTypes = {
  playerColor: PropTypes.string.isRequired,
  onClick: PropTypes.func.isRequired,
}

export default PlayerDead
