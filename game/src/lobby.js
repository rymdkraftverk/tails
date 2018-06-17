import { Entity, Sound, Util } from 'l1'
import { COLORS } from 'common'
import { code, big, small } from './util/textStyles'
import { createParabola } from './magic'

export const players = {

}

export function createLobby(gameCode, alreadyConnectedPlayers = []) {
  Entity.getAll()
    .filter(e => e.id !== 'background')
    .forEach(Entity.destroy)

  createLobbyTitle()
  createGameCodeLabel()
  createGameCodeText(gameCode)
  alreadyConnectedPlayers.forEach(((player, index) => { createPlayerEntity(player, index, { newPlayer: false }) }))
}

function createLobbyTitle() {
  const text = Entity.create('lobbyText')
  const sprite = Entity.addText(text, 'LOBBY', { ...big, fill: 'white' })
  sprite.x = 50
  sprite.y = 50
}

function createGameCodeLabel() {
  const text = Entity.create('gameCodeLabel')
  const sprite = Entity.addText(text, 'Code:', { ...small, fill: 'white' })
  sprite.x = 50
  sprite.y = 260
}

function createGameCodeText(gameCode) {
  const text = Entity.create('gameCodeText')
  const sprite = Entity.addText(text, gameCode, code)
  sprite.x = 50
  sprite.y = 300
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
