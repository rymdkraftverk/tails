import * as l1 from 'l1'
import type { Behavior } from 'l1'
import * as PIXI from 'pixi.js'
import * as TextStyle from '../constant/textStyle'
import Layer from '../constant/layer'

const DURATION = 60 // ticks

export const animateScoreGainOnLivingPlayers = (color: string) => l1
  .getByLabel('player')
  .filter(p => p && p.alive)
  .forEach(player => displayGainedPoint(color, player))

const displayGainedPoint = (color: string, player: PIXI.DisplayObject) => {
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

  const move = l1.addBehavior({
    onUpdate: ({ counter }: Behavior) => {
      scoreGainEntity.y -= 1
      scoreGainEntity.alpha = 1 - (counter / DURATION)
    },
  })

  l1.addBehavior({
    duration:   DURATION,
    onComplete: () => {
      l1.removeBehavior(move)
      l1.destroy(scoreGainEntity)
    },
  })
}
