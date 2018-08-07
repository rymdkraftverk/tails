import React, { Component } from 'react'

const noop = () => {}

navigator.vibrate = (navigator.vibrate ||
  navigator.webkitVibrate ||
  navigator.mozVibrate ||
  navigator.msVibrate || noop)

export default class PlayerDead extends Component {
    render() {
        navigator.vibrate(100)
        return (<b>You dead</b>)
    }
}