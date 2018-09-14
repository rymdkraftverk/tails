import l1 from 'l1'
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
    x:      -300,
    y:      200,
    parent: l1.get(Scene.GAME),
    text:   `Winner is ${winner}!`,
    zIndex: Layer.FOREGROUND + 10,
    style:  {
      ...TextStyle.BIG,
      fill: Color[winner],
    },
  })

  roundEnd.asset.anchor.set(0.5)
  l1.addBehavior(
    roundWinnerTextAnimation(),
    roundEnd,
  )

  l1.addBehavior(
    pauseAndTransitionToScoreScene(),
    roundEnd,
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
    entity.x = data.animation(counter)
  },
})

window.debug = {
  ...window.debug,
  transitionToRoundEnd,
}
