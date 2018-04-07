// eslint-disable-next-line no-unused-vars
import { Game, Entity, Timer, Key, Debug, Gamepad, Physics, Sound, Net, Text } from 'l1'
import io from 'socket.io-client'
import sprites from './sprites.json'

const ADDRESS = 'http://localhost:3000'
const game = {
  gameCode: '',
}

Game.init(1200, 600, sprites, { debug: true }).then(() => {
  const ws = io(ADDRESS)
  ws.emit('game.create', '')
  ws.on('game.created', ({ gameCode }) => {
    console.log('gameId', gameCode)
    game.gameCode = gameCode
  })
})

// function createPlayer(index) {
//   const square = Entity.create('square-red')
//   const sprite = Entity.addSprite(square, 'square-red')
//   sprite.scale.set(5)
//   sprite.x = 100
//   sprite.y = 100
// }
