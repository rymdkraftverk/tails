import React, { Component } from 'react';
import logo from './logo.svg';
import './App.css';

import LockerRoom from './LockerRoom'
import LockerRoomLoader from './LockerRoomLoader'

const APP_STATE = {
  LOCKER_ROOM: 'locker-room',
  GAME_CONNECTING: 'game-connecting',
  GAME_LOBBY: 'game-lobby',
}

const getLastGameCode = () => {
  const gameCode = localStorage.getItem('gameCode')
  return gameCode ? gameCode : ''
}

const setLastGameCode = (gameCode) => {
  localStorage.setItem('gameCode', gameCode)
  return gameCode
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      appState: APP_STATE.LOCKER_ROOM,
      gameCode: '',
    }
  }

  componentDidMount() {
    const gameCode = getLastGameCode()
    this.setState({ gameCode })
  }

  gameCodeChange = ({ target: { value } }) => {
    this.setState({ gameCode: value })
  }

  checkConnectionTimeout = () => {
    if (this.state.appState === APP_STATE.GAME_CONNECTING) {
      this.setState({ appState: APP_STATE.LOCKER_ROOM })
    }
  }

  onJoin = () => {
    console.log('on join')
    this.setState({ appState: APP_STATE.GAME_CONNECTING })
    setLastGameCode(this.state.gameCode)
    setTimeout(this.checkConnectionTimeout, 3 * 1000)
  }

  render() {
    return (
      <div>
        {this.state.appState === APP_STATE.LOCKER_ROOM ? <LockerRoom gameCodeChange={this.gameCodeChange} gameCode={this.state.gameCode} onJoin={this.onJoin} /> : null}
        {this.state.appState === APP_STATE.GAME_CONNECTING ? <LockerRoomLoader /> : null}
      </div>
    );
  }
}

export default App;
