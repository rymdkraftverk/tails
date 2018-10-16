import * as l1 from 'l1'
import * as PIXI from 'pixi.js'
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

  const roundEndText = new PIXI.Text(
    `Winner is ${winner}!`,
    {
      ...TextStyle.BIG,
      fontSize: TextStyle.BIG.fontSize * l1.getScale(),
      fill:     Color[winner],
    },
  )
  l1.add(
    roundEndText,
    {
      id:     Scene.ROUND_END,
      parent: l1.get(Scene.GAME),
      zIndex: Layer.FOREGROUND + 10,
    },
  )

  roundEndText.x = -300
  roundEndText.y = 200
  roundEndText.anchor.set(0.5)

  const behaviorsToAdd = [
    roundWinnerTextAnimation(roundEndText),
    pauseAndTransitionToScoreScene(),
  ]

  R.forEach(
    l1.addBehavior,
    behaviorsToAdd,
  )
}

const pauseAndTransitionToScoreScene = () => ({
  duration:   TIME_UNTIL_ROUND_END_RESTARTS,
  onComplete: () => {
    l1.destroy(Scene.GAME)
    l1.getAllBehaviors()
      .map(l1.removeBehavior)
    // l1.removeBehavior(l1.getBehaviorByLabel('collisionCheckerPowerup'))

    transitionToScoreScene()
  },
})

const WINNER_TEXT_ANIMATION_DURATION = 120

const roundWinnerTextAnimation = roundEndText => ({
  duration: WINNER_TEXT_ANIMATION_DURATION,
  onInit:   ({ data }) => {
    data.animation = createEaseInAndOut({
      start:    -(roundEndText.width / 2),
      end:      GAME_WIDTH + (roundEndText.width / 2),
      duration: WINNER_TEXT_ANIMATION_DURATION,
    })
  },
  onUpdate: ({ counter, data }) => {
    roundEndText.x = data.animation(counter)
  },
})

window.debug = {
  ...window.debug,
  transitionToRoundEnd,
}
