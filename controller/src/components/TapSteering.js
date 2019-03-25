import PropTypes from 'prop-types'
import React from 'react'
import styled from 'styled-components/macro'
import { Event, SteeringCommand } from 'common'

const Separator = styled.div`
  background: black;
  width: 20px;
`

const Container = styled.div`
  display: flex;
  overflow: hidden;
  height: 100%;
`

const Button = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  font-size: 100pt;
`

const TapSteering = props => {
  const sendCommand = command => () => {
    props.send({
      event: Event.PLAYER_MOVEMENT,
      payload: command,
    })
  }

  return (
    <Container>
      <Button
        onMouseDown={sendCommand(SteeringCommand.LEFT)}
        onMouseUp={sendCommand(SteeringCommand.NONE)}
        onTouchStart={sendCommand(SteeringCommand.LEFT)}
        onTouchEnd={sendCommand(SteeringCommand.NONE)}
      >
        <div>{'<'} </div>
      </Button>
      <Separator />
      <Button
        onMouseDown={sendCommand(SteeringCommand.RIGHT)}
        onMouseUp={sendCommand(SteeringCommand.NONE)}
        onTouchStart={sendCommand(SteeringCommand.RIGHT)}
        onTouchEnd={sendCommand(SteeringCommand.NONE)}
      >
        <div>{'>'} </div>
      </Button>
    </Container>
  )
}

TapSteering.propTypes = {
  send: PropTypes.func.isRequired,
}

export default TapSteering
