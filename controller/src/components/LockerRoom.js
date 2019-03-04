import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Notifications, { notify } from 'react-notify-toast'
import styled from 'styled-components'
import IOSDisableDoubleTap from './IOSDisableDoubleTap'
import Logo from './Logo';

const PLACEHOLDER = 'Code'

const PageContainer = styled(IOSDisableDoubleTap)`

`

const Container = styled.div`
  display: flex;
  height: 60vh;
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
  user-select: none;
  color: #4085af;
  opacity: ${({ disabled }) => (disabled ? '0.2' : '1')};
`

const onFocus = (e) => {
  e.target.placeholder = ''
}

const onBlur = (e) => {
  e.target.placeholder = PLACEHOLDER
}

class LockerRoom extends Component {
  componentDidMount() {
    const {
      error,
    } = this.props

    if (error) {
      notify.show(error, 'error')
    }

    const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (connection && connection.type === 'cellular') {
      notify.show('Connect to WiFi for best experience', 'warning')
    }
  }

  onKeyPress = (e) => {
    if (this.isSubmit(e.key)) this.props.onJoinClick()
  }

  isSubmit = pressed =>
    this.gameCodeFilled() &&
    pressed === 'Enter'

  gameCodeFilled = () => this.props.gameCode.length === 4

  render() {
    const {
      gameCode,
      onJoinClick,
      gameCodeChange,
    } = this.props

    return (
      <PageContainer>
        <Logo />
        <Container>
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
            {

              <GameJoinButton
                disabled={!this.gameCodeFilled()}
                onClick={onJoinClick}
              >
                Join
              </GameJoinButton>
            }
          </ContainerColumn>
          <Notifications />
        </Container>
      </PageContainer>
    )
  }
}

LockerRoom.propTypes = {
  error:          PropTypes.string,
  gameCode:       PropTypes.string.isRequired,
  onJoinClick:    PropTypes.func.isRequired,
  gameCodeChange: PropTypes.func.isRequired,
}

LockerRoom.defaultProps = {
  error: null,
}

export default LockerRoom
