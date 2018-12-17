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
  align-items: center;
  justify-content: center;
`

const Text = styled.div`
  font-weight: bold;
`
const AwaitingNextRound = ({ playerColor }) => (
  <Container
    color={playerColor}
  >
    <Text>Awaiting next round</Text>
  </Container>
)

AwaitingNextRound.propTypes = {
  playerColor: PropTypes.string.isRequired,
}

export default AwaitingNextRound
