import { Entity, Timer, Text } from 'l1'
import { EVENTS, COLORS } from 'common'
import { createEaseInAndOut } from './magic'
import { calculatePlayerScores, getMatchWinners, scoreToWin, applyPlayerScores } from './game'
import { transitionToLobby } from './lobby'
import { gameState, GAME_WIDTH } from '.'
import { big } from './util/textStyles'
import layers from './util/layers'
import { transitionToMatchEnd } from './matchEnd'

const TIME_UNTIL_ROUND_END_RESTARTS = 240

export const transitionToRoundEnd = () => {
  const scores = calculatePlayerScores(gameState)
  gameState.players = applyPlayerScores(gameState.players, scores)

  const { winner } = gameState.lastRoundResult
  const roundEnd = Entity.addChild(
    Entity.getRoot(),
    {
      id: 'round-end',
      x:  -300,
      y:  200,
    },
  )
  const text = Text.show(
    roundEnd,
    {
      text:   `Winner is ${winner}!`,
      zIndex: layers.FOREGROUND + 10,
      style:  {
        ...big,
        fill: COLORS[winner],
      },
    },
  )

  text.anchor.set(0.5)
  roundEnd.behaviors.winnerTextAnimation = roundWinnerTextAnimation()

  const { players } = gameState
  const matchWinnerCount = getMatchWinners(players, scoreToWin(players)).length

  roundEnd.behaviors.pause = matchWinnerCount > 0
    ? pauseAndTransitionToMatchEnd()
    : pauseAndTransitionToLobby()
}

const pauseAndTransitionToMatchEnd = () => ({
  timer: Timer.create({ duration: TIME_UNTIL_ROUND_END_RESTARTS }),
  run:   ({ timer }) => Timer.run(timer) && transitionToMatchEnd(),
})

const pauseAndTransitionToLobby = () => ({
  timer: Timer.create({ duration: TIME_UNTIL_ROUND_END_RESTARTS }),
  run:   (b) => {
    if (Timer.run(b.timer)) {
      Object
        .values(gameState.controllers)
        .forEach((controller) => {
          controller.send({ event: EVENTS.RTC.ROUND_END, payload: {} })
        })

      transitionToLobby(gameState.gameCode, Object.values(gameState.players))
    }
  },
})

const roundWinnerTextAnimation = () => ({
  tick: 0,
  init: (b, e) => {
    b.animation = createEaseInAndOut({
      start:    -(e.asset.width / 2),
      end:      GAME_WIDTH + (e.asset.width / 2),
      duration: 120,
    })
  },
  run: (b, e) => {
    e.x = b.animation(b.tick)
    b.tick += 1
  },
})
