import * as l2 from 'l2'
import type { Behavior } from 'l2'
import * as PIXI from 'pixi.js'
import * as TextStyle from '../constant/textStyle'
import Layer from '../constant/layer'

const DURATION = 60 // ticks

export const animateScoreGainOnLivingPlayers = (color: string) => l2
  .getByLabel('player')
  .filter(p => p && p.alive)
  .forEach(player => displayGainedPoint(color, player))

const displayGainedPoint = (color: string, player: PIXI.Container) => {
  const scoreGainEntity = new PIXI.Text({
    text:  '+1',
    style: {
      ...TextStyle.SMALL,
      fill: color,
    },
  })
  l2.add(
    scoreGainEntity,
    {
      zIndex: Layer.FOREGROUND,
    },
  )

  scoreGainEntity.x = player.x
  scoreGainEntity.y = player.y

  const move = l2.addBehavior({
    onUpdate: ({ counter }: Behavior) => {
      scoreGainEntity.y -= 1
      scoreGainEntity.alpha = 1 - (counter / DURATION)
    },
  })

  l2.addBehavior({
    duration:   DURATION,
    onComplete: () => {
      l2.removeBehavior(move)
      l2.destroy(scoreGainEntity)
    },
  })
}
