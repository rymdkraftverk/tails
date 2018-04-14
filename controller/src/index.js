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
document.getElementById('body').appendChild(button)

const rtc = new RTCPeerConnection(configuration)

rtc
  .createOffer()
  .then((offer) => {
    console.log('offer: ', offer)
    rtc.setLocalDescription(offer)
    controller.offer = offer
  })

function onSubmitClick() {
  const code = document.getElementById('code-input').value
  const ws = io(ADDRESS)

  const dataChannel = rtc.createDataChannel('channel.data')

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
        console.log('controller.candidates', controller.candidates)
        controller.candidates.forEach((candidate) => {
          ws.emit(EVENTS.CONTROLLER_CANDIDATE, { gameId: code, candidate })
        })
      })
  })

  rtc.onicecandidate = (event) => {
    console.log('onicecandidate ', event)
    if (!event.candidate) {
      return
    }
    controller.candidates = controller.candidates.concat(event.candidate)
  }

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
