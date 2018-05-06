// eslint-disable-next-line no-unused-vars
import { Game, Entity, Timer, Key, Debug, Gamepad, Physics, Sound, Net, Text, Util } from 'l1'
import io from 'socket.io-client'
import uuid from 'uuid/v4'
import EVENTS from '../../common/events'
import sprites from './sprites.json'
import { createLobby, addPlayerToLobby, players } from './lobby'
import { gameState } from './game'

const ADDRESS = process.env.WS_ADDRESS || 'http://localhost:3000'

const MAX_PLAYERS_ALLOWED = 10

export const game = {
  started:                        false,
  gameCode:                       '',
  hasReceivedControllerCandidate: false,
  controllers:                    {

  },
  lastResult: {
    winner: null,
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

Game.init(WIDTH, HEIGHT, sprites, { debug: false }).then(() => {
  const ws = io(ADDRESS)
  ws.emit(EVENTS.CREATE, '')

  const background = Entity.create('background')
  Entity.addSprite(background, 'background', { zIndex: -999 })

  ws.on(EVENTS.CREATED, ({ gameCode }) => {
    console.log('gameId', gameCode)
    game.gameCode = gameCode
    createLobby(game.gameCode)
  })

  ws.on(EVENTS.OFFER, ({ offer, controllerId }) => {
    console.log('received EVENTS.OFFER offer: ', offer)
    console.log('received EVENTS.OFFER controllerId: ', controllerId)
    const controller = new RTCPeerConnection(configuration)
    game.controllers[controllerId] = {
      rtc:           controller,
      candidates:    [],
      lastMoveOrder: -1,
      channel:       null,
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
      game.controllers[controllerId].channel = event.channel
      // eslint-disable-next-line no-param-reassign
      event.channel.onopen = () => {
        // Add logic for when player has joined here
        console.log('channel: on open')
      }

      // eslint-disable-next-line no-param-reassign
      event.channel.onmessage = (e) => {
        const data = JSON.parse(e.data)

        const moveLeft = () => {
          Entity.get(`${playerId}controller`).direction = LEFT
        }

        const moveRight = () => {
          Entity.get(`${playerId}controller`).direction = RIGHT
        }

        const moveStraight = () => {
          Entity.get(`${playerId}controller`).direction = null
        }

        const playerMovement = () => {
          const {
            command,
            ordering,
          } = data.payload
          if (!game.started) return

          if (game.controllers[controllerId].lastOrder >= ordering) {
            console.log(`dropping old move: ${ordering}`)
            return
          }
          // console.log(`ordering: ${ordering}`)
          game.controllers[controllerId].lastMoveOrder = ordering
          const commandFn = commands[command]
          if (commandFn) {
            commandFn()
          }
        }

        const playerJoined = () => {
          if (Object.keys(players).length < MAX_PLAYERS_ALLOWED && !game.started) {
            const { color } = addPlayerToLobby({ playerId })
            event.channel.send(JSON.stringify({ event: 'player.joined', payload: { playerId, color } }))
          } else {
            event.channel.close()
            controller.close()
          }
        }

        const gameStart = () => {
          if (!game.started) {
            Object
              .values(game.controllers)
              .forEach(({ channel }) =>
                channel.send(JSON.stringify({ event: EVENTS.GAME_STARTED, payload: {} })))

            gameState()
            game.started = true
          }
        }

        const events = {
          [EVENTS.PLAYER_MOVEMENT]: playerMovement,
          [EVENTS.PLAYER_JOINED]:   playerJoined,
          [EVENTS.GAME_START]:      gameStart,
        }

        const commands = {
          [LEFT]:  moveLeft,
          [RIGHT]: moveRight,
          none:    moveStraight,
        }

        const eventFn = events[data.event]
        if (eventFn) {
          eventFn()
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
