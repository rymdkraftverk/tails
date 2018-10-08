import l1 from 'l1'
import R from 'ramda'
import { Color } from 'common'
import { createEaseInAndOut } from './magic'
import { calculatePlayerScores, applyPlayerScores } from './game'
import { GAME_WIDTH } from './rendering'
import * as TextStyle from './util/textStyle'
import Layer from './util/layer'
import Scene from './Scene'
import { transitionToScoreScene } from './score'
import gameState, { CurrentState } from './gameState'

const TIME_UNTIL_ROUND_END_RESTARTS = 240

export const transitionToRoundEnd = () => {
  gameState.currentState = CurrentState.SCORE_OVERVIEW
  const scores = calculatePlayerScores(gameState)
  gameState.players = applyPlayerScores(gameState.players, scores)

  const { winner } = gameState.lastRoundResult

  const roundEnd = l1.text({
    id:     Scene.ROUND_END,
    parent: l1.get(Scene.GAME),
    text:   `Winner is ${winner}!`,
    zIndex: Layer.FOREGROUND + 10,
    style:  {
      ...TextStyle.BIG,
      fill: Color[winner],
    },
  })

  roundEnd.asset.x = -300
  roundEnd.asset.y = 200
  roundEnd.asset.anchor.set(0.5)

  const behaviorsToAdd = [
    roundWinnerTextAnimation(),
    pauseAndTransitionToScoreScene(),
  ]

  R.forEach(
    l1.addBehavior(roundEnd),
    behaviorsToAdd,
  )
}

const pauseAndTransitionToScoreScene = () => ({
  endTime:    TIME_UNTIL_ROUND_END_RESTARTS,
  onComplete: () => {
    l1.destroy(Scene.GAME)
    transitionToScoreScene()
  },
})

const roundWinnerTextAnimation = () => ({
  onInit: ({ entity, data }) => {
    data.animation = createEaseInAndOut({
      start:    -(entity.asset.width / 2),
      end:      GAME_WIDTH + (entity.asset.width / 2),
      duration: 120,
    })
  },
  onUpdate: ({ counter, entity, data }) => {
    entity.asset.x = data.animation(counter)
  },
})

window.debug = {
  ...window.debug,
  transitionToRoundEnd,
}
