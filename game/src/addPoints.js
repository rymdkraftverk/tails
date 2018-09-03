import R from 'ramda'
import { Entity, Text } from 'l1'
import gameState from './gameState'
import * as TextStyle from './util/textStyle'
import Layer from './util/layer'

const addPoints = (color) => {
  const livingPlayers = Object
    .keys(gameState.players)
    .map(Entity.get)
    .filter(e => !e.killed)

    // TODO refactor score gain
    /*
  livingPlayers
    .map(e => gameState.players[e.id])
    .forEach((p) => {
      p.score += 1
    })
    */

  livingPlayers
    .forEach(displayGainedPoint(color))
}

const displayGainedPoint = R.curry((color, player) => {
  const scoreGainEntity = Entity.addChild(
    Entity.getRoot(),
    {
      x: player.x,
      y: player.y,
    },
  )

  const text = Text.show(
    scoreGainEntity,
    {
      text:    '+1',
      texture: `circle-${player.color}`,
      style:   {
        ...TextStyle.SMALL,
        fill: color,
      },
      zIndex: Layer.FOREGROUND,
    },
  )

  const textDuration = 60 // ticks

  scoreGainEntity.behaviors.move = {
    tick: 0,
    run:  (b, e) => {
      b.tick += 1
      e.y -= 1

      text.alpha = 1 - (b.tick / textDuration)
    },
  }

  scoreGainEntity.behaviors.suicide = {
    tick: 0,
    run:  (b, e) => {
      b.tick += 1
      if (b.tick > textDuration) {
        Entity.destroy(e)
      }
    },
  }
})

export default addPoints
