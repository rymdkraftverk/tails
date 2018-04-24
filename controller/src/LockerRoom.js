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
      <div id="lobby-container">
        <div className="flex-box">
          {this.props.gameCode.length === 4
            ? <button
              id="lobby-join-button"
              onClick={this.props.onJoin}>
              Join
                </button>
            : null}
        </div>

        <div className="flex-box">
          <input
            id="lobby-game-code-input"
            type="text"
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
        <Notifications />
      </div>
    )
  }
}

export default LockerRoom
