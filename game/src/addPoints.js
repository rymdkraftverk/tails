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
    x:       player.x,
    y:       player.y,
    text:    '+1',
    texture: `circle-${player.color}`,
    style:   {
      ...TextStyle.SMALL,
      fill: color,
    },
    zIndex: Layer.FOREGROUND,
  })

  const move = () => ({
    onUpdate: ({ counter, entity }) => {
      entity.y -= 1
      scoreGainEntity.asset.alpha = 1 - (counter / DURATION)
    },
  })

  const suicide = () => ({
    endTime:    DURATION,
    onComplete: ({ entity }) => {
      l1.destroy(entity)
    },
  })

  R.pipe(
    l1.addBehavior(move()),
    l1.addBehavior(suicide()),
  )(scoreGainEntity)
})

export default addPoints
