import React, { Component } from 'react'
import Notifications, { notify } from 'react-notify-toast'

/* eslint-disable-next-line fp/no-class */
class LockerRoom extends Component {
  componentDidMount() {
    if (this.props.showError) {
      notify.show('Failed to connect, try again!', 'error')
    }
  }

  render() {
    return (
      <div id="lobby-container" style={{ touchAction: 'manipulation' }}>
        <div className="flex-box" style={{ touchAction: 'manipulation' }}>
          <input
            id="lobby-game-code-input"
            type="text"
            style={{ touchAction: 'manipulation' }}
            value={this.props.gameCode}
            onChange={this.props.gameCodeChange}
            placeholder="Code"
            className="game-join-input"
            spellCheck="false"
            autoComplete="off"
            autoCorrect="off"
            autoCapitalize="off"
            maxLength="4" />
        </div>
        <div className="flex-box" style={{ touchAction: 'manipulation' }}>
          {this.props.gameCode.length === 4
            ? <button
              id="lobby-join-button"
              onClick={this.props.onJoin}>
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
