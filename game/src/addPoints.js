import R from 'ramda'
import l1 from 'l1'
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
  const scoreGainEntity = l1.text({
    text:  '+1',
    style: {
      ...TextStyle.SMALL,
      fill: color,
    },
    zIndex: Layer.FOREGROUND,
  })

  scoreGainEntity.asset.x = player.asset.x
  scoreGainEntity.asset.y = player.asset.y

  const move = () => ({
    onUpdate: ({ counter, entity }) => {
      entity.asset.y -= 1
      scoreGainEntity.asset.alpha = 1 - (counter / DURATION)
    },
  })

  const suicide = () => ({
    duration:   DURATION,
    onComplete: ({ entity }) => {
      l1.destroy(entity)
    },
  })


  R.forEach(
    l1.addBehavior(scoreGainEntity),
    [
      move(),
      suicide(),
    ],
  )
})

export default addPoints
