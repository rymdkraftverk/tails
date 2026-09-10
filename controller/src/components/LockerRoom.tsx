import { Component } from 'react'
import styled from 'styled-components'
import FullHeight from './FullHeight'
import IOSDisableDoubleTap from './IOSDisableDoubleTap'
import Logo from './Logo'
import ScrollLock from './ScrollLock'

const PLACEHOLDER = 'Code'

const Container = styled.div`
  display: flex;
`

const StyledLogo = styled(Logo)`
  margin-top: 1vw;
`

const ContainerColumn = styled.div`
  width: 50vw;
  display: flex;
  align-items: center;
  justify-content: center;
`

const GameCodeInput = styled.input`
  letter-spacing: 0.5em;
  font-size: 5vw;
  text-align: center;
  text-decoration: none;
  font-family: 'patchy-robots';
  outline: none;
  border: 0;
  background: transparent;
  border-bottom: 3px solid #4085af;
  width: 70%;
  caret-color: #4085af;
  color: #4085af;
`
const GameJoinButton = styled.button`
  color: #4085af;
  opacity: ${({ disabled }) => (disabled ? '0.2' : '1')};
`

const onFocus = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.placeholder = ''
  e.target.select()
}

const onBlur = (e: React.FocusEvent<HTMLInputElement>) => {
  e.target.placeholder = PLACEHOLDER
}

type LockerRoomProps = {
  gameCode: string
  onJoinClick: () => void
  gameCodeChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

class LockerRoom extends Component<LockerRoomProps> {
  onKeyPress = (e: React.KeyboardEvent) => {
    if (this.isSubmit(e.key)) this.props.onJoinClick()
  }

  isSubmit = (pressed: string) => this.gameCodeFilled() && pressed === 'Enter'

  gameCodeFilled = () => this.props.gameCode.length === 4

  render() {
    const { gameCode, onJoinClick, gameCodeChange } = this.props

    return (
      <IOSDisableDoubleTap>
        <ScrollLock />
        <FullHeight>
          <StyledLogo />
          <Container style={{ height: '50dvh' }}>
            <ContainerColumn>
              <GameCodeInput
                type="text"
                value={gameCode}
                onChange={gameCodeChange}
                placeholder={PLACEHOLDER}
                onFocus={onFocus}
                onBlur={onBlur}
                onKeyPress={this.onKeyPress}
                className="game-join-input"
                spellCheck="false"
                autoComplete="off"
                autoCorrect="off"
                autoCapitalize="off"
              />
            </ContainerColumn>
            <ContainerColumn>
              <GameJoinButton
                disabled={!this.gameCodeFilled()}
                onClick={onJoinClick}
              >
                Join
              </GameJoinButton>
            </ContainerColumn>
          </Container>
        </FullHeight>
      </IOSDisableDoubleTap>
    )
  }
}

export default LockerRoom
