import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Notifications, { notify } from 'react-notify-toast'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  flex-direction: column;
  touch-action: manipulation;
`

const ContainerRow = styled.div`
  height: 30vh;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: manipulation;
`

const GameCodeInput = styled.input`
  letter-spacing: 0.5em;
  font-size: 4vw;
  text-align: center;
  text-decoration: none;
  font-family: 'patchy-robots';
  max-width: 100%;
  outline: none;
  border: 0;
  background: transparent;
  border-bottom: 3px solid #4085af;
  width: 40%;
  caret-color: #4085af;
  color: #4085af;
  touch-action: manipulation;
`

const GameJoinButton = styled.button`
  user-select: none;
  align-self: flex-start;
  touch-action: manipulation;
  color: #4085af;
`

const NotificationsStyled = styled(Notifications)`
  touch-action: manipulation;
`

class LockerRoom extends Component {
  componentDidMount() {
    const {
      error,
    } = this.props

    if (error) {
      notify.show(error, 'error')
    }
  }

  onKeyPress = (e) => {
    if (this.isSubmit(e.key)) this.props.onJoin()
  }

  isSubmit = pressed =>
    this.gameCodeFilled() &&
    pressed === 'Enter'

  gameCodeFilled = () => this.props.gameCode.length === 4

  render() {
    const {
      gameCode,
      onJoin,
      gameCodeChange,
    } = this.props

    const placeholder = 'Code'

    return (
      <Container>
        <ContainerRow>
          <GameCodeInput
            type="text"
            value={gameCode}
            onChange={gameCodeChange}
            placeholder={placeholder}
            onFocus={(e) => { e.target.placeholder = '' }}
            onBlur={(e) => { e.target.placeholder = placeholder }}
            onKeyPress={this.onKeyPress}
            className="game-join-input"
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            maxLength="4"
          />
        </ContainerRow>
        <ContainerRow>
          {
            this.gameCodeFilled()
              ?
                <GameJoinButton
                  onClick={onJoin}
                >
                Join
                </GameJoinButton>
              : null
          }
        </ContainerRow>
        <NotificationsStyled />
      </Container>
    )
  }
}

LockerRoom.propTypes = {
  error:          PropTypes.string,
  gameCode:       PropTypes.string.isRequired,
  onJoin:         PropTypes.func.isRequired,
  gameCodeChange: PropTypes.func.isRequired,
}

LockerRoom.defaultProps = {
  error: null,
}

export default LockerRoom
