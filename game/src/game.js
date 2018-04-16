import { Entity, Timer } from 'l1'
import uuid from 'uuid/v4'
import { LEFT, RIGHT } from '.'
import { players } from './lobby'

export function gameState() {
  Entity.getAll()
    .forEach(Entity.destroy)

  Object.keys(players)
    .map(key => players[key])
    .forEach(createPlayer)
}

function createPlayer({ playerId, spriteId }, index) {
  const square = Entity.create(playerId)
  const sprite = Entity.addSprite(square, spriteId)
  sprite.scale.set(1)
  sprite.x = 10 + (index * 100)
  sprite.y = 10
  sprite.scale.set(0.4)
  square.behaviors.pivot = pivot(playerId)
  square.behaviors.trail = trail(spriteId)
  square.behaviors.move = move()
  square.behaviors.collisionChecker = collisionChecker()

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
    e.sprite.x += x * 1.3
    e.sprite.y += y * 1.3
  },
})

const pivot = playerId => ({
  run: (b, e) => {
    if (Entity.get(`${playerId}controller`).direction === LEFT) {
      if (e.degrees >= 360) {
        e.degrees = 0
        return
      }
      e.degrees += 3
    } else if (Entity.get(`${playerId}controller`).direction === RIGHT) {
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

const trail = spriteId => ({
  timer: Timer.create(5),
  run:   (b, e) => {
    if (b.timer.run()) {
      const trailE = Entity.create(`trail${uuid()}`)
      trailE.active = false
      Entity.addType(trailE, 'trail')
      const sprite = Entity.addSprite(trailE, spriteId)
      sprite.scale.set(0.4)
      sprite.x = e.sprite.x + ((e.sprite.width / 2) - (sprite.width / 2))
      sprite.y = e.sprite.y + ((e.sprite.height / 2) - (sprite.height / 2))
      b.timer.reset()

      trailE.behaviors.activate = activate()
    }
  },
})

const activate = () => ({
  timer: Timer.create(60),
  run:   (b, e) => {
    if (b.timer.run()) {
      e.active = true
    }
  },
})


const collisionChecker = () => ({
  timer: Timer.create(10),
  run:   (b, e) => {
    if (b.timer.run()) {
      const allTrails = Entity
        .getByType('trail')
        .filter(t => t.active)

      if (allTrails.some(t => Entity.isColliding(t, e))) {
        Entity.destroy(e)
      }
      b.timer.reset()
    }
  },
})
