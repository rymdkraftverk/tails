import {
  FullHeight,
  IOSDisableDoubleTap,
  ScrollLock,
} from 'rkv-signaling/screens'
import styled from 'styled-components'

const Container = styled(FullHeight)`
  display: flex;
  flex-direction: column;
  background: var(--player-color);
  align-items: center;
  justify-content: center;
`

const Text = styled.div`
  font-weight: bold;
`
const AwaitingNextRound = ({ playerColor }: { playerColor: string }) => {
  return (
    <IOSDisableDoubleTap>
      <ScrollLock />
      <Container style={{ '--player-color': playerColor }}>
        <Text>Awaiting next round</Text>
      </Container>
    </IOSDisableDoubleTap>
  )
}

export default AwaitingNextRound
