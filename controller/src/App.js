import React, { Component } from 'react'
import Fullscreen from 'react-full-screen'
import io from 'socket.io-client'
import EVENTS from 'common'

import LockerRoom from './LockerRoom'
import LockerRoomLoader from './LockerRoomLoader'
import GameLobby from './GameLobby'
import GamePlaying from './GamePlaying'

const WS_ADDRESS = 'http://10.0.201.123:3000'

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
  GAME_PLAYING:    'game-playing',
}

const isMobileDevice = () => (typeof window.orientation !== 'undefined') || (navigator.userAgent.indexOf('IEMobile') !== -1)

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

/* eslint-disable-next-line fp/no-class */
class App extends Component {
  state = {
    appState:    APP_STATE.LOCKER_ROOM,
    fullscreen:  false,
    gameCode:    '',
    channel:     null,
    playerId:    null,
    playerColor: null,
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
      this.setState({ appState: APP_STATE.LOCKER_ROOM, channel: null })
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
      this.setState({ channel })
      this.send({ event: EVENTS.PLAYER_JOINED })
    }

    channel.onmessage = ({ data }) => {
      const event = JSON.parse(data)

      if (event.event === EVENTS.PLAYER_JOINED) {
        this.setState({
          appState:    APP_STATE.GAME_LOBBY,
          playerColor: '#42a1f4',
          playerId:    event.playerId,
        })
      } else if (event.event === EVENTS.GAME_START) {
        this.setState({
          appState: APP_STATE.GAME_PLAYING,
        })
      }
    }

    channel.onerror = cleanUp
    channel.onclose = cleanUp
  }

  componentDidMount() {
    const gameCode = getLastGameCode()
    this.setState({ gameCode })
  }

  gameCodeChange = ({ target: { value } }) => {
    this.setState({ gameCode: value.toUpperCase() })
  };

  checkConnectionTimeout = () => {
    if (this.state.appState === APP_STATE.GAME_CONNECTING) {
      this.setState({ appState: APP_STATE.LOCKER_ROOM })
    }
  };

  onJoin = () => {
    this.setState({ appState: APP_STATE.GAME_CONNECTING, fullscreen: true })
    setLastGameCode(this.state.gameCode)
    setTimeout(this.checkConnectionTimeout, 5 * 1000)
    this.connectToGame(this.state.gameCode)
  };

  send = (data) => {
    if (!this.state.channel) {
      return
    }

    this.state.channel.send(JSON.stringify(data))
  }

  startGame = () => {
    this.send({ event: EVENTS.GAME_START })
    this.setState({ appState: APP_STATE.GAME_PLAYING })
  }

  enableFullscreen = () => this.state.fullscreen && isMobileDevice()

  render() {
    return (
      <Fullscreen
        enabled={this.enableFullscreen()}
        onChange={fullscreen => this.setState({ fullscreen })}>
        {
          this.state.appState === APP_STATE.LOCKER_ROOM
            ? <LockerRoom
                gameCodeChange={this.gameCodeChange}
                gameCode={this.state.gameCode}
                onJoin={this.onJoin} />
            : null
        }
        {
          this.state.appState === APP_STATE.GAME_CONNECTING
            ? <LockerRoomLoader />
            : null
        }
        {
          this.state.appState === APP_STATE.GAME_LOBBY
            ? <GameLobby
                startGame={this.startGame}
                playerColor={this.state.playerColor} />
            : null
        }
        {
          this.state.appState === APP_STATE.GAME_PLAYING
            ? <GamePlaying send={this.send}/>
            : null
        }
      </Fullscreen>
    )
  }
}

export default App
