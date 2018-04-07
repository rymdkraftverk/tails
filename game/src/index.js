// eslint-disable-next-line no-unused-vars
import { Game, Entity, Timer, Key, Debug, Gamepad, Physics, Sound, Net, Text } from 'l1'
import sprites from './sprites.json'

Game.init(600, 400, sprites, { debug: true, physics: true }).then(() => {
  Game.getPhysicsEngine().world.gravity.y = 1

  const square = Entity.create('square')
  const sprite = Entity.addSprite(square, 'square')
  Entity.addBody(square, Physics.Bodies.rectangle(100, 10, 80, 80))
  sprite.scale.set(5)

  const floor = Entity.create('floor')
  Entity.addBody(floor, Physics.Bodies.rectangle(300, 390, 600, 10, { isStatic: true }))
})
