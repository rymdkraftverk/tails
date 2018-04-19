import React, { Component } from 'react'
import io from 'socket.io-client'
import EVENTS from 'common'
import './App.css'

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
  LOCKER_ROOM:     'locker-room',
  GAME_CONNECTING: 'game-connecting',
  GAME_LOBBY:      'game-lobby',
}

const getLastGameCode = () => {
  const gameCode = localStorage.getItem('gameCode')
  return gameCode || ''
}

const setLastGameCode = (gameCode) => {
  localStorage.setItem('gameCode', gameCode)
  return gameCode
}

const rtcCleanUP = ({ peer, channel }) => {
  if (channel) {
    channel.close()
  }

  if (peer) {
    peer.close()
  }
}

const wsCleanUp = ({ ws }) => {
  if (ws) {
    ws.disconnect()
    ws.close()
  }
}

const connectionCleanUp = ({ ws, peer, channel }) => {
  rtcCleanUP({ peer, channel })
  wsCleanUp({ ws })
}

/* eslint-disable-next-line */
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
      error:      false,
      connected:  false,
    }

    const cleanUp = () => {
      if (state.error) {
        return
      }

      state.error = true
      connectionCleanUp({ ws, peer, channel })
      this.setState({ appState: APP_STATE.LOCKER_ROOM })
    }

    ws.on('connect', () => {
      peer
        .createOffer()
        .then(offer => Promise.all([offer, peer.setLocalDescription(offer)]))
        .then(([offer]) => ws.emit(EVENTS.OFFER, { gameCode, offer }))
    })

    ws.on(EVENTS.ANSWER, ({ answer }) => {
      peer
        .setRemoteDescription(answer)
        .then(() =>
          state.candidates.forEach(c =>
            ws.emit(EVENTS.CONTROLLER_CANDIDATE, { gameCode, candidate: c })))
    })

    ws.on(EVENTS.GAME_CANDIDATE, ({ candidate }) => {
      peer.addIceCandidate(new RTCIceCandidate(candidate))
    })

    peer.onicecandidate = (e) => {
      if (!e.candidate) {
        return
      }
      state.candidates = state.candidates.concat(e.candidate)
    }

    channel.onopen = () => {
      state.connected = true
      wsCleanUp({ ws })
      this.setState({ appState: APP_STATE.GAME_LOBBY })
    }

    channel.onmessage = () => {
      // cb(null, e)
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
  };

  checkConnectionTimeout = () => {
    if (this.state.appState === APP_STATE.GAME_CONNECTING) {
      this.setState({ appState: APP_STATE.LOCKER_ROOM })
    }
  };

  onJoin = () => {
    this.setState({ appState: APP_STATE.GAME_CONNECTING })
    setLastGameCode(this.state.gameCode)
    setTimeout(this.checkConnectionTimeout, 5 * 1000)
    this.connectToGame(this.state.gameCode)
  };

  render() {
    return (
      <div>
        {this.state.appState === APP_STATE.LOCKER_ROOM ? (
          <LockerRoom
            gameCodeChange={this.gameCodeChange}
            gameCode={this.state.gameCode}
            onJoin={this.onJoin}
          />
        ) : null}
        {this.state.appState === APP_STATE.GAME_CONNECTING ? (
          <LockerRoomLoader />
        ) : null}
        {this.state.appState === APP_STATE.GAME_LOBBY ? <GameLobby /> : null}
      </div>
    )
  }
}

export default App
