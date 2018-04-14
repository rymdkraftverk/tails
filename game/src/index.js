// eslint-disable-next-line no-unused-vars
import { Game, Entity, Timer, Key, Debug, Gamepad, Physics, Sound, Net, Text } from 'l1'
import io from 'socket.io-client'
import EVENTS from '../../common/events'
import sprites from './sprites.json'

const ADDRESS = 'http://localhost:3000'
const game = {
  gameCode:    '',
  controllers: {

  },
}

const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
}

Game.init(1200, 600, sprites, { debug: true }).then(() => {
  const ws = io(ADDRESS)
  ws.emit('game.create', '')

  ws.on('game.created', ({ gameCode }) => {
    console.log('gameId', gameCode)
    game.gameCode = gameCode
  })

  ws.on(EVENTS.OFFER, ({ offer, controllerId }) => {
    console.log('received EVENTS.OFFER offer: ', offer)
    console.log('received EVENTS.OFFER controllerId: ', controllerId)
    const controller = new RTCPeerConnection(configuration)
    game.controllers[controllerId] = {
      rtc:        controller,
      candidates: [],
    }
    controller.onicecandidate = (event) => {
      if (!event.candidate) {
        return
      }
      const { candidates } = game.controllers[controllerId]
      game.controllers[controllerId].candidates = candidates.concat(event.candidate)
    }

    controller
      .setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => controller.createAnswer())
      .then((answer) => {
        controller.setLocalDescription(answer)
        ws.emit(EVENTS.ANSWER, { answer, controllerId })
      })
    controller.ondatachannel = (event) => {
      // eslint-disable-next-line no-param-reassign
      event.channel.onopen = () => {
        console.log('chanel on open')
      }
      console.log('on fucking datachannel')
    }
  })

  ws.on(EVENTS.CONTROLLER_CANDIDATE, ({ controllerId, candidate }) => {
    console.log('received EVENTS.CONTROLLER_CANDIDATE offer: ', candidate)
    const controller = game.controllers[controllerId]
    if (!controller) {
      return
    }
    controller.rtc.addIceCandidate(new RTCIceCandidate(candidate))
    controller.candidates = controller.candidates.reduce((emptyList, c) => {
      ws.emit(EVENTS.GAME_CANDIDATE, { candidate: c, controllerId })
      return emptyList
    }, [])
  })
})


// function createPlayer(index) {
//   const square = Entity.create('square-red')
//   const sprite = Entity.addSprite(square, 'square-red')
//   sprite.scale.set(5)
//   sprite.x = 100
//   sprite.y = 100
// }
