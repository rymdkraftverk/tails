import React, { Component } from 'react'

class LockerRoom extends Component {
  constructor(props) {
    super(props)
    this.state = { gameCode: '' }
  }

  gameCodeChange = ({ target: { value } }) => {
    this.setState({ gameCode: value })
  }

  render() {
    return (
      <div id="lobby-container">
        <div className="flex-box">
          {
            this.state.gameCode.length === 4
              ? <button id="lobby-join-button">Join</button>
              : null
          }
        </div>

        <div className="flex-box">
          <input
            id="lobby-game-code-input"
            type="text"
            value={this.state.gameCode}
            onChange={this.gameCodeChange}
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

export default LockerRoom;