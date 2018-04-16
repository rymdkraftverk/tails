// eslint-disable-next-line no-unused-vars
import { Game, Entity, Timer, Key, Debug, Gamepad, Physics, Sound, Net, Text, Util } from 'l1'
import io from 'socket.io-client'
import uuid from 'uuid/v4'
import EVENTS from '../../common/events'
import sprites from './sprites.json'
import lobby, { addPlayerToLobby, players } from './lobby'
import { gameState } from './game'

const ADDRESS = 'http://localhost:3000'
const game = {
  started:                        false,
  gameCode:                       '',
  hasReceivedControllerCandidate: false,
  controllers:                    {

  },
}

const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
}

export const LEFT = 'left'
export const RIGHT = 'right'

export const WIDTH = 1200
export const HEIGHT = 600

Game.init(WIDTH, HEIGHT, sprites, { debug: true }).then(() => {
  const ws = io(ADDRESS)
  ws.emit(EVENTS.CREATE, '')

  ws.on(EVENTS.CREATED, ({ gameCode }) => {
    console.log('gameId', gameCode)
    game.gameCode = gameCode
    lobby(game.gameCode)
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
      if (game.hasReceivedControllerCandidate) {
        ws.emit(EVENTS.GAME_CANDIDATE, { candidate: event.candidate, controllerId })
      }
    }

    controller
      .setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => controller.createAnswer())
      .then((answer) => {
        controller.setLocalDescription(answer)
        ws.emit(EVENTS.ANSWER, { answer, controllerId })
      })
    controller.ondatachannel = (event) => {
      const playerId = uuid()
      // eslint-disable-next-line no-param-reassign
      event.channel.onopen = () => {
        // Add logic for when player has joined here

        console.log('channel: on open')
      }

      // eslint-disable-next-line no-param-reassign
      event.channel.onmessage = (e) => {
        const data = JSON.parse(e.data)

        if (data.event === 'player.movement') {
          const {
            command,
          } = data.payload
          // Temporary solution to start game
          if (!game.started) {
            gameState()
            game.started = true
          } else if (command === LEFT) {
            Entity.get(`${playerId}controller`).direction = LEFT
          } else if (command === RIGHT) {
            Entity.get(`${playerId}controller`).direction = RIGHT
          } else if (command === 'none') {
            Entity.get(`${playerId}controller`).direction = null
          }
        } else if (data.event === 'player.joined') {
          console.log('Object.keys(players)', Object.keys(players))
          if (Object.keys(players).length < 4 && !game.started) {
            addPlayerToLobby({ playerId })
            event.channel.send(JSON.stringify({ event: 'player.joined', payload: { playerId } }))
          } else {
            event.channel.close()
            controller.close()
          }
        } else if (data.event === 'game.start') {
          // TODO Add event to start game
          // game()
        }
      }
      console.log('on datachannel')
    }
  })

  ws.on(EVENTS.CONTROLLER_CANDIDATE, ({ controllerId, candidate }) => {
    console.log('received EVENTS.CONTROLLER_CANDIDATE offer: ', candidate)
    game.hasReceivedControllerCandidate = true
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
})

// Enable the following behaviour for keyboard debugging

// const player1Keyboard = () => ({
//   run: () => {
//     if (Key.isDown('left')) {
//       Entity.get('player1controller').direction = LEFT
//     } else if (Key.isDown('right')) {
//       Entity.get('player1controller').direction = RIGHT
//     } else {
//       Entity.get('player1controller').direction = null
//     }
//   },
// })
