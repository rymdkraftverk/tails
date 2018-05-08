// eslint-disable-next-line no-unused-vars
import { Game, Entity, Timer, Key, Debug, Gamepad, Physics, Sound, Net, Text, Util } from 'l1'
import uuid from 'uuid/v4'
import EVENTS from '../../common/events'
import sprites from './sprites.json'
import { createLobby, addPlayerToLobby, players } from './lobby'
import { gameState } from './game'

const WS_ADDRESS = process.env.WS_ADDRESS || 'ws://localhost:3000'

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

const { log, warn } = console

export const LEFT = 'left'
export const RIGHT = 'right'

export const WIDTH = 1200
export const HEIGHT = 600

const emit = (ws, event, payload) => {
  const message = JSON.stringify({ event, payload })
  ws.send(message)
}

const onGameCreated = () => (event, { gameCode }) => {
  log('gameId', gameCode)
  game.gameCode = gameCode
  createLobby(game.gameCode)
}

const onOffer = ws => (event, { offer, controllerId }) => {
  log('received EVENTS.OFFER offer: ', offer)
  log('received EVENTS.OFFER controllerId: ', controllerId)
  const controller = new RTCPeerConnection(configuration)
  game.controllers[controllerId] = {
    rtc:           controller,
    candidates:    [],
    lastMoveOrder: -1,
    channel:       null,
  }
  controller.onicecandidate = (rtcEvent) => {
    log('onicecandidate', rtcEvent)
    if (!rtcEvent.candidate) {
      return
    }
    const { candidates } = game.controllers[controllerId]
    game.controllers[controllerId].candidates = candidates.concat(rtcEvent.candidate)
    if (game.hasReceivedControllerCandidate) {
      emit(ws, EVENTS.GAME_CANDIDATE, { candidate: rtcEvent.candidate, controllerId })
    }
  }

  controller
    .setRemoteDescription(new RTCSessionDescription(offer))
    .then(() => controller.createAnswer())
    .then((answer) => {
      controller.setLocalDescription(answer)
      emit(ws, EVENTS.ANSWER, { answer, controllerId })
    })

  controller.ondatachannel = (rtcEvent) => {
    const playerId = uuid()
    game.controllers[controllerId].channel = rtcEvent.channel
    // eslint-disable-next-line no-param-reassign
    rtcEvent.channel.onopen = () => {
      // Add logic for when player has joined here
      log('channel: on open')
    }

    // eslint-disable-next-line no-param-reassign
    rtcEvent.channel.onmessage = (e) => {
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

        if (game.controllers[controllerId].lastOrder >= ordering) {
          log(`dropping old move: ${ordering}`)
          return
        }
        // log(`ordering: ${ordering}`)
        game.controllers[controllerId].lastMoveOrder = ordering
        const commandFn = commands[command]
        if (commandFn) {
          commandFn()
        }
      }

      const playerJoined = () => {
        if (Object.keys(players).length < MAX_PLAYERS_ALLOWED && !game.started) {
          const { color } = addPlayerToLobby({ playerId })
          rtcEvent.channel.send(JSON.stringify({ event: 'player.joined', payload: { playerId, color } }))
        } else {
          rtcEvent.channel.close()
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

      const rtcEvents = {
        [EVENTS.PLAYER_MOVEMENT]: playerMovement,
        [EVENTS.PLAYER_JOINED]:   playerJoined,
        [EVENTS.GAME_START]:      gameStart,
      }

      const commands = {
        [LEFT]:  moveLeft,
        [RIGHT]: moveRight,
        none:    moveStraight,
      }

      const eventFn = rtcEvents[data.event]
      if (eventFn) {
        eventFn()
      }
    }
    log('on datachannel')
  }
}

const onControllerCandidate = ws => (event, { controllerId, candidate }) => {
  log('received EVENTS.CONTROLLER_CANDIDATE offer: ', candidate)
  game.hasReceivedControllerCandidate = true
  const controller = game.controllers[controllerId]
  if (!controller) {
    return
  }
  controller.rtc.addIceCandidate(new RTCIceCandidate(candidate))
  controller.candidates = controller.candidates.reduce((emptyList, c) => {
    emit(ws, EVENTS.GAME_CANDIDATE, { candidate: c, controllerId })
    return emptyList
  }, [])
}

const events = {
  [EVENTS.CREATED]:              onGameCreated,
  [EVENTS.OFFER]:                onOffer,
  [EVENTS.CONTROLLER_CANDIDATE]: onControllerCandidate,
}

const onMessage = ws => (message) => {
  const { event, payload } = JSON.parse(message.data)
  const f = events[event]
  if (!f) {
    warn(`Unhandled event for message: ${message.data}`)
    return
  }
  f(ws)(event, payload)
}

Game.init(WIDTH, HEIGHT, sprites, { debug: false }).then(() => {
  const ws = new WebSocket(WS_ADDRESS)

  ws.onopen = () => {
    emit(ws, EVENTS.CREATE)
  }
  ws.onmessage = onMessage(ws)

  const background = Entity.create('background')
  Entity.addSprite(background, 'background', { zIndex: -999 })

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
