import R from 'ramda'
import { Entity, Text } from 'l1'
import gameState from './gameState'
import { small } from './util/textStyles'
import { FOREGROUND } from './util/layers'

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
        ...small,
        fill: color,
      },
      zIndex: FOREGROUND,
    },
  )

  const textDuration = 1000

  scoreGainEntity.behaviors.move = {
    tick: 0,
    init: () => {},
    run:  (b, e) => {
      b.tick += 1
      e.y -= 1

      text.alpha = 1 - (b.tick / ((textDuration / 1000) * 60))
    },
  }

  setTimeout(() => Entity.destroy(scoreGainEntity), textDuration)
})

export default addPoints
