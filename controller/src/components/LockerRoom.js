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
            gameCode.length === 4
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
  error:          PropTypes.string,
  gameCode:       PropTypes.string.isRequired,
  onJoin:         PropTypes.func.isRequired,
  gameCodeChange: PropTypes.func.isRequired,
}

LockerRoom.defaultProps = {
  error: null,
}

export default LockerRoom
