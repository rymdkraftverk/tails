// eslint-disable-next-line no-unused-vars
import { Game, Entity, Timer, Key, Debug, Gamepad, Physics, Sound, Net, Text } from 'l1'
import io from 'socket.io-client'
// import sprites from './sprites.json'
import EVENTS from '../../common/events'

const ADDRESS = 'http://localhost:3000'

const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
}
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
  console.log('onicecandidate ', event)
  if (!event.candidate) {
    return
  }
  controller.candidates = controller.candidates.concat(event.candidate)
}

rtc
  .createOffer()
  .then((offer) => {
    console.log('offer: ', offer)
    controller.offer = offer
    return rtc.setLocalDescription(offer)
  })
  .then(() => {
    console.log('local description is set')
  })

function onSubmitClick() {
  const code = document.getElementById('code-input').value
  const ws = io(ADDRESS)

  dataChannel.onopen = () => {
    console.log('data chanel on open')
  }

  ws.emit(EVENTS.OFFER, {
    gameCode: code,
    offer:    controller.offer,
  })

  ws.on(EVENTS.ANSWER, ({ answer }) => {
    console.log('received EVENTS.ANSWER: ', answer)
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
    console.log('received EVENTS.GAME_CANDIDATE: ', candidate)
    rtc.addIceCandidate(new RTCIceCandidate(candidate))
  })

  // Game.init(1200, 600, sprites, { debug: true, element: document.getElementById('game') }).then(() => {

  // })
}

// function createPlayer(index) {
//   const square = Entity.create('square-red')
//   const sprite = Entity.addSprite(square, 'square-red')
//   sprite.scale.set(5)
//   sprite.x = 100
//   sprite.y = 100
// }
