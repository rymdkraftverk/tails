import { Entity } from 'l1'
import { LEFT, RIGHT } from '.'
import { players } from './lobby'

export function game() {
  Entity.getAll()
    .forEach(Entity.destroy)

  players.entries()
    .forEach(([playerId, player]) => createPlayer(playerId))
}

function createPlayer(playerId, spriteId) {
  const square = Entity.create(playerId)
  const sprite = Entity.addSprite(square, spriteId)
  sprite.scale.set(1)
  sprite.x = 10
  sprite.y = 10
  square.behaviors.pivot = pivot()
  square.behaviors.move = move()

  // Enable the following behaviour for keyboard debugging
  // square.behaviors.player1Keyboard = player1Keyboard()

  const controller = Entity.create(`${playerId}controller`)
  controller.direction = null
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
