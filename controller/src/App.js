import React, { Component } from 'react';
import io from 'socket.io-client'
import './App.css';

import EVENTS from 'common'
import LockerRoom from './LockerRoom'
import LockerRoomLoader from './LockerRoomLoader'
import GameLobby from './GameLobby'

const WS_ADDRESS = 'http://localhost:3000'

const RTC = {
  SERVERS: {
    iceServers: [
      {
        urls: 'stun:stun.l.google.com:19302',
      },
    ],
  },
  CHANNEL_NAME: 'data.channel',
}

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

const rtcCleanUP = ({ peer, channel }) => {
  if (channel) {
    console.log('cleaning up channel')
    channel.close()
  }

  if (peer) {
    console.log('cleaning up peer')
    peer.close()
  }
}

const wsCleanUp = ({ ws }) => {
  if (ws) {
    console.log('cleaning up ws')
    ws.disconnect()
    ws.close()
  }
}

const connectionCleanUp = ({ ws, peer, channel }) => {
  rtcCleanUP({ peer, channel })
  wsCleanUp({ ws })
}

class App extends Component {
  constructor(props) {
    super(props)
    this.state = {
      appState: APP_STATE.LOCKER_ROOM,
      gameCode: '',
    }
  }

  connectToGame(gameCode) {
    const peer = new RTCPeerConnection(RTC.SERVERS)
    const channel = peer.createDataChannel(RTC.CHANNEL_NAME)
    const ws = io(WS_ADDRESS)

    const state = {
      candidates: [],
      error: false,
      connected: false,
    }

    const cleanUp = (err) => {
      if (state.error) {
        return
      }

      console.log('cleaning up')

      state.error = true
      connectionCleanUp({ ws, peer, channel })
      this.setState({ appState: APP_STATE.LOCKER_ROOM })
    }

    ws.on('connect', () => {
      console.log('WS | connect')
      peer
        .createOffer()
        .then(offer =>
          Promise
            .all([
              offer,
              peer
                .setLocalDescription(offer),
            ]))
        .then(([offer]) => ws.emit(EVENTS.OFFER, { gameCode, offer }))
    })

    ws.on(EVENTS.ANSWER, ({ answer }) => {
      console.log('ws answer')
      peer
        .setRemoteDescription(answer)
        .then(() =>
          state.candidates.forEach(c =>
            ws.emit(EVENTS.CONTROLLER_CANDIDATE, { gameCode, candidate: c })))
    })

    ws.on(EVENTS.GAME_CANDIDATE, ({ candidate }) => {
      console.log('ws game candidate')
      peer.addIceCandidate(new RTCIceCandidate(candidate))
    })

    peer.onicecandidate = (e) => {
      if (!e.candidate) {
        return
      }
      console.log('peer ice candidate')
      state.candidates = state.candidates.concat(e.candidate)
    }

    channel.onopen = () => {
      console.log('channel open')
      state.connected = true
      wsCleanUp({ ws })
      this.setState({ appState: APP_STATE.GAME_LOBBY })
    }

    channel.onmessage = (e) => {
      console.log('message:', e)
      //cb(null, e)
    }

    channel.onerror = cleanUp
    channel.onclose = cleanUp
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
    setTimeout(this.checkConnectionTimeout, 5 * 1000)
    this.connectToGame(this.state.gameCode)
  }

  render() {
    return (
      <div>
        {this.state.appState === APP_STATE.LOCKER_ROOM ? <LockerRoom gameCodeChange={this.gameCodeChange} gameCode={this.state.gameCode} onJoin={this.onJoin} /> : null}
        {this.state.appState === APP_STATE.GAME_CONNECTING ? <LockerRoomLoader /> : null}
        {this.state.appState === APP_STATE.GAME_LOBBY ? <GameLobby /> : null}
      </div>
    );
  }
}

export default App;
