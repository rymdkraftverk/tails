import { Entity, Util, Timer } from 'l1'
import uuid from 'uuid/v4'
import { LEFT, RIGHT, WIDTH, HEIGHT, game } from '.'
import { players } from './lobby'
import { transitionToGameover } from './gameover'

export function gameState() {
  Entity.getAll()
    .forEach(Entity.destroy)

  Object.values(players)
    .forEach(createPlayer)
}

function createPlayer({ playerId, spriteId, color }, index) {
  const square = Entity.create(playerId)
  const sprite = Entity.addSprite(square, spriteId)
  Entity.addType(square, 'player')
  sprite.scale.set(1)
  sprite.x = 200 + ((index % 4) * 250)
  sprite.y = 200 + (index > 3 ? 200 : 0)
  sprite.scale.set(0.4)
  square.behaviors.pivot = pivot(playerId)
  square.behaviors.trail = trail(spriteId)
  square.color = color
  square.behaviors.move = move(Util.getRandomInRange(0, 360))
  square.behaviors.collisionChecker = collisionChecker()
  square.isAlive = true

  // Enable the following behaviour for keyboard debugging
  // square.behaviors.player1Keyboard = player1Keyboard()
  const controller = Entity.create(`${playerId}controller`)
  controller.direction = null
}

function toRadians(angle) {
  return angle * (Math.PI / 180)
}

const move = startingDegrees => ({
  init: (b, e) => {
    e.degrees = startingDegrees
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
      } else if (e.sprite.x < 0 || e.sprite.x > WIDTH || e.sprite.y < 0 || e.sprite.y > HEIGHT) {
        Entity.destroy(e)
        console.log('PLAYER DIED DUE TO OUT OF BOUNDS!')
      }
      if (Entity.getByType('player').length === 1 && game.started) {
        game.started = false
        game.lastResult.winner = Entity.getByType('player')[0].color
        transitionToGameover()
      }
      b.timer.reset()
    }
  },
})
