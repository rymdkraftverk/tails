import * as l1 from './l1'
import type { Behavior } from './l1'
import * as PIXI from 'pixi.js'
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

  l1.addBehavior(roundWinnerTextAnimation(roundEndText))
  l1.addBehavior(pauseAndTransitionToScoreScene())
}

const pauseAndTransitionToScoreScene = () => ({
  duration:   TIME_UNTIL_ROUND_END_RESTARTS,
  onComplete: () => {
    // Clear the particle containers before the scene they sit in goes away
    l1
      .getByLabel('particleContainer')
      .forEach(displayObject => l1.destroy(displayObject, { children: false }))

    l1.getAllBehaviors()
      .forEach(behavior => l1.removeBehavior(behavior))
    l1.destroy(Scene.GAME)

    transitionToScoreScene()
  },
})

const WINNER_TEXT_ANIMATION_DURATION = 120

type WinnerTextData = { animation: ((t: number) => number) | null }

const roundWinnerTextAnimation = (roundEndText: PIXI.Text) => ({
  duration: WINNER_TEXT_ANIMATION_DURATION,
  data:     { animation: null } as WinnerTextData,
  onInit:   ({ data }: Behavior<WinnerTextData>) => {
    if (roundEndText.l1.isDestroyed()) {
      return
    }

    data.animation = createEaseInAndOut({
      start:    -(roundEndText.width / 2),
      end:      GAME_WIDTH + (roundEndText.width / 2),
      duration: WINNER_TEXT_ANIMATION_DURATION,
    })
  },
  onUpdate: ({ counter, data }: Behavior<WinnerTextData>) => {
    if (data.animation) {
      roundEndText.x = data.animation(counter)
    }
  },
})

window.debug = {
  ...window.debug,
  transitionToRoundEnd,
}
