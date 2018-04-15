import { Entity } from 'l1'

export const players = {

}

const COLORS = [
  'red',
  'black',
  'yellow',
  'green',
]

export default function (gameCode) {
  createLobbyTitle()
  createGameCodeText(gameCode)
}

function createLobbyTitle() {
  const text = Entity.create('lobbyText')
  const sprite = Entity.addText(text, 'LOBBY')
  sprite.x = 10
  sprite.y = 10
  sprite.scale.set(5)
}

function createGameCodeText(gameCode) {
  const text = Entity.create('gameCodeText')
  const sprite = Entity.addText(text, gameCode)
  sprite.x = 10
  sprite.y = 200
  sprite.scale.set(3)
}

export function addPlayerToLobby(player) {
  const playerCount = Object.keys(players).length
  const color = COLORS[playerCount]

  const square = Entity.create(`square-${color}`)
  const sprite = Entity.addSprite(square, `square-${color}`)
  sprite.scale.set(3)
  sprite.x = 500
  sprite.y = 10 + (playerCount * 100)
  players[player.playerId] = player
  players[player.playerId].spriteId = `square-${color}`
}
