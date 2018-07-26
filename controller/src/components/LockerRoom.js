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

  render() {
    const {
      gameCode,
      onJoin,
      gameCodeChange,
    } = this.props

    const placeholder = 'Code'

    const gameCodeFilled = () => gameCode.length === 4

    const isSubmit = (pressed) =>
      gameCodeFilled() &&
      pressed === 'Enter'

    const onKeyPress = (e) => {
      if (isSubmit(e.key)) onJoin()
    }

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
            onKeyPress={onKeyPress}
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
            gameCodeFilled()
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
