import * as l1 from 'l1'
import * as PIXI from 'pixi.js'
import R from 'ramda'
import { Color } from 'common'
import { createEaseInAndOut } from './magic'
import { GAME_WIDTH } from './constant/rendering'
import * as TextStyle from './constant/textStyle'
import Layer from './constant/layer'
import Scene from './Scene'
import { transitionToScoreScene } from './score'
import { State, state } from './state'
import playerRepository from './repository/player'
import repository from './repository'
import http from './http'

const TIME_UNTIL_ROUND_END_RESTARTS = 240

export const transitionToRoundEnd = () => {
  state.state = State.SCORE_OVERVIEW
  playerRepository.resetReady()

  const { winner } = state.lastRoundResult
  http.postScoreBoard(repository.identifiableScoreBoard())

  const roundEndText = new PIXI.Text(
    `${winner} wins!`,
    {
      ...TextStyle.BIG,
      fill: Color[winner],
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
    // This is needed due to pixi-particles crashing if you destroy
    // the parent of an emitter while particles are still active
    l1
      .getByLabel('particleContainer')
      .forEach(displayObject => l1.destroy(displayObject, { children: false }))

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
