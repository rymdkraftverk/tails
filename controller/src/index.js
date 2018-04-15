import io from 'socket.io-client'
import EVENTS from '../../common/events'

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

const WS_ADDRESS = 'http://192.168.0.109:3000'
const DIRECTION = { NONE: 'none', LEFT: 'left', RIGHT: 'right' }

const UI_CONTROLLER_LEFT_ID = 'controller-left'
const UI_CONTROLLER_RIGHT_ID = 'controller-right'

const uiInitController = ({ id, onStart, onEnd }) => {
  document.getElementById(id).addEventListener('touchstart', onStart)
  document.getElementById(id).addEventListener('touchend', onEnd)
  document.getElementById(id).addEventListener('touchcancel', onEnd)
}

const uiInitInput = ({ id, onComplete }) => {
  document.getElementById(id).value = ''
  document.getElementById(id).addEventListener('input', (e) => {
    console.log('e:', e)
  })
}

/* eslint-disable */
const setDirectionNone = state => () => { state.direction = DIRECTION.NONE }
const setDirectionRight = state => () => { state.direction = DIRECTION.RIGHT }
const setDirectionLeft = state => () => { state.direction = DIRECTION.LEFT }
/* eslint-enable */

const uiInit = (state) => {
  uiInitController({
    id:      UI_CONTROLLER_LEFT_ID,
    onStart: setDirectionLeft(state),
    onEnd:   setDirectionNone(state),
  })

  uiInitController({
    id:      UI_CONTROLLER_RIGHT_ID,
    onStart: setDirectionRight(state),
    onEnd:   setDirectionNone(state),
  })
}

const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
}


const start = () => {
  const controller = {
    offer:      null,
    candidates: [],
  }

  const button = document.createElement('button')
  button.addEventListener('click', onSubmitClick)
  button.innerHTML = 'submit'
  button.classList.add('code-submit-button')
  document.getElementById('body').appendChild(button)

  const rtc = new RTCPeerConnection(configuration)
  const dataChannel = rtc.createDataChannel('channel.data')

  rtc.onicecandidate = (event) => {
    console.log('onicecandidate', event)
    if (!event.candidate) {
      return
    }
    controller.candidates = controller.candidates.concat(event.candidate)
  }

  rtc
    .createOffer()
    .then((offer) => {
      console.log('offer:', offer)
      controller.offer = offer
      return rtc.setLocalDescription(offer)
    })
    .then(() => {
      console.log('local description is set')
    })

  function onSubmitClick() {
    const code = document.getElementById('code-input').value

    dataChannel.onopen = () => {
      console.log('data chanel on open')
    }

    ws.emit(EVENTS.OFFER, {
      gameCode: code,
      offer:    controller.offer,
    })

    ws.on(EVENTS.ANSWER, ({ answer }) => {
      console.log('received EVENTS.ANSWER:', answer)
      rtc
        .setRemoteDescription(answer)
        .then(() => {
          controller.candidates.forEach((candidate) => {
            console.log('emitting candidate', candidate)
            ws.emit(EVENTS.CONTROLLER_CANDIDATE, { gameCode: code, candidate })
          })
        })
    })

    ws.on(EVENTS.GAME_CANDIDATE, ({ candidate }) => {
      console.log('received EVENTS.GAME_CANDIDATE:', candidate)
      rtc.addIceCandidate(new RTCIceCandidate(candidate))
    })
  }
}

const UI = {
  LOBBY_CONTAINER:       'lobby-container',
  LOBBY_GAME_CODE_INPUT: 'lobby-game-code-input',
  LOBBY_JOIN_BUTTON:     'lobby-join-button',
  CONTROLLER_CONTAINER:  'controller-container',
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
  const peer = new RTCPeerConnection(configuration)
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

const ready = () => {
  const state = {
    joining: false,
    ingame:  false,
  }

  toggleFullScreen()
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
        document.getElementById(UI.LOBBY_GAME_CODE_INPUT).disabled = false
        document.getElementById(UI.LOBBY_JOIN_BUTTON).disabled = false

        return
      }

      if (!data) {
        state.ingame = true
        console.log('connected to game')
        document.getElementById(UI.LOBBY_CONTAINER).style.display = 'none'
        document.getElementById(UI.CONTROLLER_CONTAINER).style.display = 'flex'
        return
      }

      const response = emit({ event: 'EVENT.TEST' })
      console.log('response:', response)
    })
  })
}

window.ready(ready)
