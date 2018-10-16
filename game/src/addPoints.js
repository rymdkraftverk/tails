import R from 'ramda'
import * as l1 from 'l1'
import * as PIXI from 'pixi.js'
import gameState from './gameState'
import * as TextStyle from './util/textStyle'
import Layer from './util/layer'

const DURATION = 60 // ticks

const addPoints = (color) => {
  const livingPlayers = Object
    .keys(gameState.players)
    .map(l1.get)
    .filter(e => e && !e.killed)

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
  const scoreGainEntity = new PIXI.Text(
    '+1',
    {
      ...TextStyle.SMALL,
      fontSize: TextStyle.SMALL * l1.getScale(),
      fill:     color,
    },
  )
  l1.add(
    scoreGainEntity,
    {
      zIndex: Layer.FOREGROUND,
    },
  )

  scoreGainEntity.x = player.x
  scoreGainEntity.y = player.y

  const move = () => ({
    onUpdate: ({ counter }) => {
      // TODO: This check should not be needed
      if (scoreGainEntity.parent) {
        scoreGainEntity.y -= 1
        scoreGainEntity.alpha = 1 - (counter / DURATION)
      }
    },
  })

  const suicide = () => ({
    duration:   DURATION,
    onComplete: () => {
      l1.removeBehavior(move)
      l1.destroy(scoreGainEntity)
    },
  })


  R.forEach(
    l1.addBehavior,
    [
      move(player),
      suicide(),
    ],
  )
})

export default addPoints
