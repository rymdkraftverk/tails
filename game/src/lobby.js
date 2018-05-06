import { Entity } from 'l1'
import { big, small } from './util/text'

export const players = {

}

const COLORS = [
  'red',
  'black',
  'yellow',
  'green',
  'pink',
  'brown',
  'lightblue',
  'orange',
]

export function createLobby(gameCode) {
  Entity.getAll()
    .forEach(Entity.destroy)

  createLobbyTitle()
  createGameCodeText(gameCode)
}

function createLobbyTitle() {
  const text = Entity.create('lobbyText')
  const sprite = Entity.addText(text, 'LOBBY', big('white'))
  sprite.x = 10
  sprite.y = 10
}

function createGameCodeText(gameCode) {
  const text = Entity.create('gameCodeText')
  const sprite = Entity.addText(text, gameCode, small('white'))
  sprite.x = 10
  sprite.y = 200
}

export function addPlayerToLobby(player) {
  const playerCount = Object.keys(players).length
  const color = COLORS[playerCount]

  const square = Entity.create(`square-${color}`)
  const sprite = Entity.addSprite(square, `square-${color}`)
  sprite.scale.set(3)
  sprite.x = 400 + (playerCount > 3 ? 200 : 0)
  sprite.y = 10 + ((playerCount % 4) * 100)
  players[player.playerId] = player
  players[player.playerId].spriteId = `square-${color}`
  players[player.playerId].color = color

  return players[player.playerId]
}
