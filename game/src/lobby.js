import { Entity, Sound, Util } from 'l1'
import { COLORS } from 'common'
import { getRatio } from './'
import { code, big, small } from './util/textStyles'
import { createParabola } from './magic'

export const players = {

}

const CONTROLLER_PORT = '4001'

const deployedURLs = {
  'game.rymdkraftverk.com': 'rymdkraftverk.com',
}

const getControllerUrl = () => {
  const {
    location: {
      hostname,
      port,
    },
  } = window

  return port ? `${hostname}:${CONTROLLER_PORT}` : deployedURLs[hostname]
}

export function createLobby(gameCode, alreadyConnectedPlayers = []) {
  Entity.getAll()
    .filter(e => e.id !== 'background')
    .forEach(Entity.destroy)

  createLobbyTitle()
  createGameCodeLabel()
  createGameCodeText(gameCode)
  createControllerURLLabel()
  createControllerURLText(getControllerUrl())
  alreadyConnectedPlayers
    .forEach(((player, index) => { createPlayerEntity(player, index, { newPlayer: false }) }))
}

function createLobbyTitle() {
  const text = Entity.create('lobbyText')
  const sprite = Entity.addText(text, 'LOBBY', { ...big, fill: 'white', fontSize: 48 * getRatio() })
  sprite.scale.set(1 / getRatio())

  text.originalSize = 48
  sprite.x = 50
  sprite.y = 40
}

function createGameCodeLabel() {
  const text = Entity.create('gameCodeLabel')
  const sprite = Entity.addText(text, 'Code:', { ...small, fontSize: small.fontSize * getRatio(), fill: 'white' })
  sprite.scale.set(1 / getRatio())

  text.originalSize = small.fontSize
  sprite.x = 50
  sprite.y = 360
}

function createGameCodeText(gameCode) {
  const text = Entity.create('gameCodeText')
  const sprite = Entity.addText(text, gameCode, { ...code, fontSize: code.fontSize * getRatio() })
  sprite.scale.set(1 / getRatio())

  text.originalSize = code.fontSize
  sprite.x = 50
  sprite.y = 400
}

function createControllerURLLabel() {
  const text = Entity.create('controllerURLLabel')
  const sprite = Entity.addText(text, 'Go to:', { ...small, fill: 'white' })
  sprite.x = 50
  sprite.y = 170
}

function createControllerURLText(controllerURL) {
  const text = Entity.create('controllerURLText')
  const sprite = Entity.addText(text, controllerURL, { ...code, fontSize: 30 })
  sprite.x = 50
  sprite.y = 200
}

export function addPlayerToLobby(player) {
  const playerCount = Object.keys(players).length
  const color = Object.keys(COLORS)[playerCount]

  players[player.playerId] = player
  players[player.playerId].spriteId = `square-${color}`
  players[player.playerId].color = color
  createPlayerEntity(player, playerCount, { newPlayer: true })

  return players[player.playerId]
}

function createPlayerEntity({ color }, playerCount, { newPlayer }) {
  const square = Entity.create(`square-${color}`)
  const sprite = Entity.addSprite(square, `square-${color}`)
  sprite.scale.set(3)
  sprite.x = 400 + (playerCount > 4 ? 200 : 0)
  sprite.y = 100 + ((playerCount % 5) * 100)
  sprite.anchor.set(0.5)
  if (newPlayer) {
    square.behaviors.animateEntrance = animateEntranceBehaviour()
    const joinSounds = [
      'join1',
      'join2',
      'join3',
    ]
    const joinSound = joinSounds[Util.getRandomInRange(0, 3)]
    const join = Sound.getSound(`./sounds/${joinSound}.wav`, { volume: 0.6 })
    join.play()
  }
}

const animateEntranceBehaviour = () => ({
  init: (b, e) => {
    b.tick = 0
    b.animation = createParabola(0, 20, -1 * e.sprite.scale.x, 0.08)
  },
  run: (b, e) => {
    b.tick += 1
    e.sprite.scale.set(-1 * b.animation(b.tick))
    if (b.tick >= 20) {
      // eslint-disable-next-line fp/no-delete
      delete e.behaviors.animateEntrance
    }
  },
})
