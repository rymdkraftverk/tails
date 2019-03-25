import React from 'react'
import * as R from 'ramda'
import styled from 'styled-components/macro'
import PropTypes from 'prop-types'
import Div100vh from 'react-div-100vh'
import IOSDisableDoubleTap from './IOSDisableDoubleTap'
import ScrollLock from './ScrollLock'

const Container = styled(Div100vh)`
  display: flex;
  flex-direction: column;
  background: ${R.prop('color')};
  align-items: center;
  justify-content: center;
`

const Text = styled.div`
  font-weight: bold;
`
const AwaitingNextRound = ({ playerColor }) => (
  <IOSDisableDoubleTap>
    <ScrollLock />
    <Container color={playerColor}>
      <Text>Awaiting next round</Text>
    </Container>
  </IOSDisableDoubleTap>
)

AwaitingNextRound.propTypes = {
  playerColor: PropTypes.string.isRequired,
}

export default AwaitingNextRound
