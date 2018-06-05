import React, { Component } from 'react'
import Fullscreen from 'react-full-screen'
import EVENTS from 'common'

import LockerRoom from './LockerRoom'
import LockerRoomLoader from './LockerRoomLoader'
import GameLobby from './GameLobby'
import GamePlaying from './GamePlaying'

const { log } = console

const { REACT_APP_WS_ADDRESS: WS_ADDRESS } = process.env
const TIMEOUT_SECONDS = 20

log('REACT_APP_WS_ADDRESS', WS_ADDRESS)

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

const { warn, error } = console

const isMobileDevice = () => (typeof window.orientation !== 'undefined') || (navigator.userAgent.indexOf('IEMobile') !== -1)
const isSafari = () => navigator.userAgent.indexOf('Safari') > -1

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
    error:       false,
  }

  connectToGame(gameCode) {
    const peer = new RTCPeerConnection(RTC.SERVERS)
    const channel = isSafari()
      ? peer.createDataChannel(RTC.CHANNEL_NAME)
      : peer.createDataChannel(RTC.CHANNEL_NAME, { ordered: false, maxRetransmits: 0 })
    const ws = new WebSocket(WS_ADDRESS)

    const state = {
      candidates:        [],
      error:             false,
      connected:         false,
      hasReceivedAnswer: false,
      gameCandidates:    [],
    }

    const cleanUp = () => {
      if (state.error) {
        return
      }

      state.error = true
      connectionCleanUp({ ws, peer, channel })
      this.setState({ appState: APP_STATE.LOCKER_ROOM, channel: null, error: true })
    }

    const onError = (event) => {
      error(event)
      cleanUp()
    }

    ws.onopen = () => {
      peer
        .createOffer()
        .then(offer => Promise.all([offer, peer.setLocalDescription(offer)]))
        .then(([offer]) => emit(EVENTS.OFFER, { gameCode, offer }))
    }

    const emit = (event, payload) => {
      const message = JSON.stringify({ event, payload })
      ws.send(message)
    }

    const onAnswer = (event, { answer }) => {
      state.hasReceivedAnswer = true

      peer
        .setRemoteDescription(answer)
        .then(() => {
          state.gameCandidates.forEach(c =>
            peer.addIceCandidate(new RTCIceCandidate(c)))
          state.candidates.forEach(c =>
            emit(EVENTS.CONTROLLER_CANDIDATE, { gameCode, candidate: c }))
        })
    }

    const onGameCandidate = (event, { candidate }) => {
      if (!state.hasReceivedAnswer) {
        state.gameCandidates = state.gameCandidates.concat(candidate)
      } else {
        peer.addIceCandidate(new RTCIceCandidate(candidate))
      }
    }

    const events = {
      [EVENTS.ANSWER]:         onAnswer,
      [EVENTS.GAME_CANDIDATE]: onGameCandidate,
    }

    ws.onmessage = (wsEvent) => {
      const { event, payload } = JSON.parse(wsEvent.data)
      const f = events[event]
      if (!f) {
        warn(`Unhandled event for message: ${wsEvent.data}`)
        return
      }
      f(event, payload)
    }

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
      const { event, payload } = JSON.parse(data)

      if (event === EVENTS.PLAYER_JOINED) {
        this.setState({
          appState:    APP_STATE.GAME_LOBBY,
          playerColor: payload.color,
          playerId:    payload.playerId,
        })
      } else if (event === EVENTS.GAME_START) {
        this.setState({
          appState: APP_STATE.GAME_PLAYING,
        })
      } else if (event === EVENTS.GAME_STARTED) {
        this.setState({
          appState: APP_STATE.GAME_PLAYING,
        })
      } else if (event === EVENTS.GAME_OVER) {
        this.setState({
          appState: APP_STATE.GAME_LOBBY,
        })
      }
    }

    channel.onerror = onError
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
      this.setState({ appState: APP_STATE.LOCKER_ROOM, error: true })
    }
  };

  onJoin = () => {
    this.setState({ appState: APP_STATE.GAME_CONNECTING, error: false, fullscreen: true })
    setLastGameCode(this.state.gameCode)
    setTimeout(this.checkConnectionTimeout, TIMEOUT_SECONDS * 1000)
    this.connectToGame(this.state.gameCode)
  };

  clearError = () => {
    this.setState({ error: false })
  }

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
    if (!WS_ADDRESS) {
      // eslint-disable-next-line fp/no-throw
      throw new Error('Please set env variable REACT_APP_WS_ADDRESS')
    }

    return (
      <Fullscreen
        style={{ touchAction: 'manipulation' }}
        enabled={this.enableFullscreen()}
        onChange={fullscreen => this.setState({ fullscreen })}>
        {
          this.state.appState === APP_STATE.LOCKER_ROOM
            ? <LockerRoom
                clearError={this.clearError}
                showError={this.state.error}
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
