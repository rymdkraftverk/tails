import io from 'socket.io-client'
import EVENTS from '../../common/events'

const WS_ADDRESS = 'http://192.168.0.109:3000'

const RTC_CONFIGURATION = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
}

const UI = {
  LOBBY_CONTAINER:       'lobby-container',
  LOBBY_GAME_CODE_INPUT: 'lobby-game-code-input',
  LOBBY_JOIN_BUTTON:     'lobby-join-button',
  CONTROLLER_CONTAINER:  'controller-container',
  CONTROLLER_LEFT:       'controller-left',
  CONTROLLER_RIGHT:      'controller-right',
}

const COMMANDS = {
  NONE:  'none',
  RIGHT: 'right',
  LEFT:  'left',
}

/* eslint-disable */
window.readyHandlers = []
window.ready = function ready(handler) {
  window.readyHandlers.push(handler)
  handleState()
};

window.handleState = function handleState() {
  if (['interactive', 'complete'].indexOf(document.readyState) > -1) {
    while (window.readyHandlers.length > 0) {
      (window.readyHandlers.shift())()
    }
  }
}
document.onreadystatechange = window.handleState;
/* eslint-enable */

const toggleFullScreen = () => {
  const doc = window.document
  const docEl = doc.documentElement

  const requestFullScreen =
    docEl.requestFullscreen
    || docEl.mozRequestFullScreen
    || docEl.webkitRequestFullScreen
    || docEl.msRequestFullscreen

  const cancelFullScreen =
    doc.exitFullscreen
    || doc.mozCancelFullScreen
    || doc.webkitExitFullscreen
    || doc.msExitFullscreen

  if (!doc.fullscreenElement
    && !doc.mozFullScreenElement
    && !doc.webkitFullscreenElement
    && !doc.msFullscreenElement) {
    requestFullScreen.call(docEl)
  } else {
    cancelFullScreen.call(doc)
  }
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

const connectToGame = (gameCode, cb) => {
  const state = {
    candidates: [],
    error:      false,
    connected:  false,
  }

  console.log('creating: ws | peer | channel')
  const ws = io(WS_ADDRESS)
  const peer = new RTCPeerConnection(RTC_CONFIGURATION)
  const channel = peer.createDataChannel('channel.data')
  const cleanUp = (err) => {
    if (state.error) {
      return
    }

    console.log('cleaning up')

    state.error = true
    connectionCleanUp({ ws, peer, channel })
    cb(err)
  }

  setTimeout(() => {
    if (state.connected) { return }
    cleanUp('failed to connect, timeout')
  }, 10 * 1000)


  ws.on('connect_error', cleanUp)

  ws.on('connect', () => {
    console.log('ws connected')
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
    cb(null, null)
  }

  channel.onmessage = (e) => {
    cb(null, e)
  }

  channel.onerror = cleanUp
  channel.onclose = cleanUp

  return data => channel.send(JSON.stringify(data))
}


const ready = () => {
  const state = {
    joining: false,
    ingame:  false,
    command: COMMANDS.NONE,
    send:    () => { },
  }

  const gameCode = localStorage.getItem('gameCode')
  if (gameCode) {
    document.getElementById(UI.LOBBY_GAME_CODE_INPUT).value = gameCode
    document.getElementById(UI.LOBBY_JOIN_BUTTON).style.display = 'flex'
  }

  setInterval(() => {
    if (state.command === COMMANDS.NONE) { return }
    console.log('command:', state.command)
    window.navigator.vibrate(10)
  }, 100)

  const leftStart = () => {
    state.command = COMMANDS.LEFT
    console.log('command:', state.command)
    window.navigator.vibrate(10)
    state.send({ event: 'player.movement', payload: { command: state.command } })
  }

  document.getElementById(UI.CONTROLLER_LEFT).addEventListener('touchstart', leftStart)
  document.getElementById(UI.CONTROLLER_LEFT).addEventListener('mousedown', leftStart)

  const rightDown = () => {
    state.command = COMMANDS.RIGHT
    console.log('command:', state.command)
    window.navigator.vibrate(10)
    state.send({ event: 'player.movement', payload: { command: state.command } })
  }

  document.getElementById(UI.CONTROLLER_RIGHT).addEventListener('touchstart', rightDown)
  document.getElementById(UI.CONTROLLER_RIGHT).addEventListener('mousedown', rightDown)

  const leftUp = () => {
    state.command = COMMANDS.NONE
    state.send({ event: 'player.movement', payload: { command: state.command } })
  }

  document.getElementById(UI.CONTROLLER_LEFT).addEventListener('touchend', leftUp)
  document.getElementById(UI.CONTROLLER_LEFT).addEventListener('mouseup', leftUp)

  const rightUp = () => {
    state.command = COMMANDS.NONE
    state.send({ event: 'player.movement', payload: { command: state.command } })
  }

  document.getElementById(UI.CONTROLLER_RIGHT).addEventListener('touchend', rightUp)
  document.getElementById(UI.CONTROLLER_RIGHT).addEventListener('mouseup', rightUp)

  document.getElementById(UI.CONTROLLER_LEFT).addEventListener('touchcancel', () => {
    state.command = COMMANDS.NONE
    state.send({ event: 'player.movement', payload: { command: state.command } })
  })

  document.getElementById(UI.CONTROLLER_RIGHT).addEventListener('touchcancel', () => {
    state.command = COMMANDS.NONE
    state.send({ event: 'player.movement', payload: { command: state.command } })
  })

  document.getElementById(UI.LOBBY_CONTAINER).style.display = 'flex'
  document.getElementById(UI.LOBBY_GAME_CODE_INPUT).addEventListener('input', (e) => {
    if (e.target.value.length === 4) {
      document.getElementById(UI.LOBBY_JOIN_BUTTON).style.display = 'block'
    } else {
      document.getElementById(UI.LOBBY_JOIN_BUTTON).style.display = 'none'
    }
  })

  document.getElementById(UI.LOBBY_JOIN_BUTTON).addEventListener('click', () => {
    if (state.joining) {
      return
    }

    toggleFullScreen()

    state.joining = true
    document.getElementById(UI.LOBBY_GAME_CODE_INPUT).disabled = true
    document.getElementById(UI.LOBBY_JOIN_BUTTON).disabled = true
    const gameCode = document.getElementById(UI.LOBBY_GAME_CODE_INPUT).value

    console.log('connecting to game:', gameCode)
    const emit = connectToGame(gameCode, (err, data) => {
      console.log('-----\nerr:', err)
      console.log('data:', data, '\n-----')
      if (err) {
        state.joining = false
        state.ingame = false
        state.send = () => { }
        document.getElementById(UI.LOBBY_GAME_CODE_INPUT).disabled = false
        document.getElementById(UI.LOBBY_JOIN_BUTTON).disabled = false
        return
      }

      if (!data) {
        localStorage.setItem('gameCode', gameCode)
        state.ingame = true
        state.send = emit
        console.log('connected to game')
        document.getElementById(UI.LOBBY_CONTAINER).style.display = 'none'
        document.getElementById(UI.CONTROLLER_CONTAINER).style.display = 'flex'
      }
    })
  })
}

window.ready(ready)
