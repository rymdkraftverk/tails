import R from 'ramda'
import * as l1 from 'l1'
import * as PIXI from 'pixi.js'
import * as TextStyle from '../constant/textStyle'
import Layer from '../constant/layer'

const DURATION = 60 // ticks

export const animateScoreGainOnLivingPlayers = color => l1
  .getByLabel('player')
  .filter(p => p && !p.killed)
  .forEach(displayGainedPoint(color))

const displayGainedPoint = R.curry((color, player) => {
  const scoreGainEntity = new PIXI.Text(
    '+1',
    {
      ...TextStyle.SMALL,
      fill: color,
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
