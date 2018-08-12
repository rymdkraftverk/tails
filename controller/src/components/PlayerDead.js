import React, { Component } from 'react'

const noop = () => {}

navigator.vibrate = (navigator.vibrate ||
  navigator.webkitVibrate ||
  navigator.mozVibrate ||
  navigator.msVibrate || noop)

class PlayerDead extends Component {
  render() {
    navigator.vibrate(100)
    return (
      <div id="game-lobby-container">
        <b className="flex-box">{'You\'re dead'}</b>
      </div>
    )
  }
}

export default PlayerDead
