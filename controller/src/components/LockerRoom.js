import React, { Component } from 'react'
import PropTypes from 'prop-types'
import Notifications, { notify } from 'react-notify-toast'

class LockerRoom extends Component {
  componentDidMount() {
    const {
      error,
    } = this.props

    if (error) {
      notify.show(error, 'error')
    }
  }

  gameCodeFilled = () => this.props.gameCode.length === 4

  isSubmit = pressed =>
    this.gameCodeFilled() &&
    pressed === 'Enter'

  onKeyPress = (e) => {
    if (this.isSubmit(e.key)) this.props.onJoin()
  }


  render() {
    const {
      gameCode,
      onJoin,
      gameCodeChange,
    } = this.props

    const placeholder = 'Code'

    return (
      <div
        id="lobby-container"
        style={{ touchAction: 'manipulation' }}
      >
        <div
          className="flex-box"
          style={{ touchAction: 'manipulation' }}
        >
          <input
            id="lobby-game-code-input"
            type="text"
            style={{ touchAction: 'manipulation' }}
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
        </div>
        <div
          className="flex-box"
          style={{ touchAction: 'manipulation' }}
        >
          {
            this.gameCodeFilled()
              ?
                <button
                  id="lobby-join-button"
                  onClick={onJoin}
                >
                Join
                </button>
              : null
          }
        </div>
        <Notifications style={{ touchAction: 'manipulation' }} />
      </div>
    )
  }
}

LockerRoom.propTypes = {
  error:          PropTypes.string.isRequired,
  gameCode:       PropTypes.string.isRequired,
  onJoin:         PropTypes.func.isRequired,
  gameCodeChange: PropTypes.func.isRequired,
}

export default LockerRoom
