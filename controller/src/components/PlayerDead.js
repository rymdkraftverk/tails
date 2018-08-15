import React from 'react'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
`

const Text = styled.b`
  height: 30vh;
  font-family : inherit;
  display: flex;
  align-items: center;
  justify-content: center;
`

const noop = () => {}

navigator.vibrate = (navigator.vibrate ||
  navigator.webkitVibrate ||
  navigator.mozVibrate ||
  navigator.msVibrate || noop)

const PlayerDead = () => {
  navigator.vibrate(100)
  return (
    <Container>
      <Text>{'You\'re dead'}</Text>
    </Container>
  )
}

export default PlayerDead
