import React, { Component } from 'react'
import Notifications, { notify } from 'react-notify-toast'

/* eslint-disable-next-line fp/no-class */
class LockerRoom extends Component {
  componentDidMount() {
    if (this.props.error) {
      notify.show(this.props.error, 'error')
    }
  }

  render() {
    const {
      gameCode,
      onJoin,
      gameCodeChange,
    } = this.props

    return (
      <div id="lobby-container" style={{ touchAction: 'manipulation' }}>
        <div className="flex-box" style={{ touchAction: 'manipulation' }}>
          <input
            id="lobby-game-code-input"
            type="text"
            style={{ touchAction: 'manipulation' }}
            value={gameCode}
            onChange={gameCodeChange}
            placeholder="Code"
            className="game-join-input"
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            maxLength="4" />
        </div>
        <div className="flex-box" style={{ touchAction: 'manipulation' }}>
          {gameCode.length === 4
            ? <button
              id="lobby-join-button"
              onClick={onJoin}>
              Join
                </button>
            : null}
        </div>
        <Notifications style={{ touchAction: 'manipulation' }} />
      </div>
    )
  }
}

export default LockerRoom
