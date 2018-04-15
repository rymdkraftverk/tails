import React, { Component } from 'react'

class LockerRoomLoader extends Component {

  render() {
    return (
      <div>
        {!this.props.error ? <div id="loader"></div> : null}
        {this.props.error ?
          <button
            id="lobby-join-button"
            onClick={this.joinGame}>Join</button>
          : null}
      </div>
    )
  }
}

export default LockerRoomLoader