import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Notifications, { notify } from 'react-notify-toast'
import styled from 'styled-components'

const Container = styled.div`
  display: flex;
  flex-direction: column;
`

const ContainerRow = styled.div`
  height: 30vh;
  font-family: inherit;
  display: flex;
  align-items: center;
  justify-content: center;
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
`

const GameJoinButton = styled.button`
  user-select: none;
  align-self: flex-start;
  color: #4085af;
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
        <Notifications />
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
