import Switch from 'react-switch'
import styled from 'styled-components'
import FullHeight from './FullHeight'
import IOSDisableDoubleTap from './IOSDisableDoubleTap'
import ScrollLock from './ScrollLock'
import TapSteering from './TapSteering'
import GyroSteering from './GyroSteering'

const VerticalSeparator = styled.div`
  width: 20px;
`

const TogglePane = styled.div`
  align-items: center;
  background: black;
  border-bottom: solid;
  border-color: white;
  color: white;
  display: flex;
  height: 40px;
  justify-content: center;
`

const Container = styled(FullHeight)`
  display: flex;
  flex-direction: column;
  background: var(--player-color);
`

const noop = () => false

navigator.vibrate =
  navigator.vibrate ||
  navigator.webkitVibrate ||
  navigator.mozVibrate ||
  navigator.msVibrate ||
  noop

type GamePlayingProps = {
  angle: number
  gyro: boolean
  playerColor: string
  send: (message: object) => void
  setGyro: (gyro: boolean) => void
}

function GamePlaying(props: GamePlayingProps) {
  const { angle, gyro, playerColor, send, setGyro } = props

  return (
    <IOSDisableDoubleTap>
      <ScrollLock />
      <Container style={{ '--player-color': playerColor }}>
        <TogglePane>
          GYRO
          <VerticalSeparator />
          <Switch onChange={setGyro} checked={gyro} />
        </TogglePane>
        {gyro ? <GyroSteering angle={angle} /> : <TapSteering send={send} />}
      </Container>
    </IOSDisableDoubleTap>
  )
}

export default GamePlaying
