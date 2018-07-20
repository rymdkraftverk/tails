import React, { Component } from 'react'

class LockerRoomLoader extends Component {
  render() {
    const {
      error,
    } = this.props

    return (
      <div style={{ touchAction: 'manipulation' }}>
        {!error ? <div id="loader" style={{ touchAction: 'manipulation' }}></div> : null}
        {error ?
          <button
            id="lobby-join-button"
            style={{ touchAction: 'manipulation' }}
            onClick={this.joinGame}>Join</button>
          : null}
      </div>
    )
  }
}

export default LockerRoomLoader
