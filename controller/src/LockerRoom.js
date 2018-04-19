import React, { Component } from 'react'

/* eslint-disable-next-line */
class LockerRoom extends Component {
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
      </div>
    )
  }
}

export default LockerRoom
