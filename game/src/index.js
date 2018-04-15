// eslint-disable-next-line no-unused-vars
import { Game, Entity, Timer, Key, Debug, Gamepad, Physics, Sound, Net, Text, Util } from 'l1'
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

const LEFT = 'left'
const RIGHT = 'right'

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
      console.log('onicecandidate', event)
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
      // Add logic for when player has joined here
      // eslint-disable-next-line no-param-reassign
      event.channel.onopen = () => {
        console.log('channel: on open')
      }

      // eslint-disable-next-line no-param-reassign
      event.channel.onmessage = (e) => {
        const data = JSON.parse(e.data)
        console.log('data', data)
        if (data.event === 'player.movement') {
          if (data.payload.command === LEFT) {
            Entity.get('player1controller').direction = LEFT
          } else if (data.payload.command === RIGHT) {
            Entity.get('player1controller').direction = RIGHT
          } else if (data.payload.command === 'none') {
            Entity.get('player1controller').direction = null
          }
        }
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
  Key.add('up')
  Key.add('down')
  Key.add('left')
  Key.add('right')
  createPlayer()
})

function createPlayer() {
  const square = Entity.create('square-red')
  const sprite = Entity.addSprite(square, 'square-red')
  sprite.scale.set(1)
  sprite.x = 10
  sprite.y = 10
  square.behaviors.pivot = pivot()
  square.behaviors.move = move()
  // square.behaviors.player1Keyboard = player1Keyboard()

  const player1controller = Entity.create('player1controller')
  player1controller.direction = null
}

function toRadians(angle) {
  return angle * (Math.PI / 180)
}

const move = () => ({
  init: (b, e) => {
    e.degrees = 0
  },
  run: (b, e) => {
    const radians = toRadians(e.degrees)
    const y = Math.cos(radians)
    const x = Math.sin(radians)
    e.sprite.x += x
    e.sprite.y += y
  },
})

const pivot = () => ({
  run: (b, e) => {
    if (Entity.get('player1controller').direction === LEFT) {
      if (e.degrees >= 360) {
        e.degrees = 0
        return
      }
      e.degrees += 3
    } else if (Entity.get('player1controller').direction === RIGHT) {
      if (e.degrees < 0) {
        e.degrees = 360
        return
      }
      e.degrees -= 3
    } else {
      // Do nothing
    }
  },
})

const player1Keyboard = () => ({
  run: () => {
    if (Key.isDown('left')) {
      Entity.get('player1controller').direction = LEFT
    } else if (Key.isDown('right')) {
      Entity.get('player1controller').direction = RIGHT
    } else {
      Entity.get('player1controller').direction = null
    }
  },
})
