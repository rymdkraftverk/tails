import { Entity, Timer } from 'l1'
import { EVENTS } from 'common'
import { createEaseInAndOut } from './magic'
import { createLobby } from './lobby'
import { calculatePlayerScores, getMatchWinners, scoreToWin, applyPlayerScores } from './game'
import { gameState, GAME_WIDTH, getRatio } from '.'
import { big } from './util/textStyles'
import layers from './util/layers'
import { transitionToMatchEnd } from './matchEnd'

const TIME_UNTIL_ROUND_END_RESTARTS = 240

export function transitionToRoundEnd() {
  const scores = calculatePlayerScores(gameState)
  gameState.players = applyPlayerScores(gameState.players, scores)

  const roundEnd = Entity.create('round-end')
  const { winner } = gameState.lastRoundResult
  const text = Entity.addText(roundEnd, `${winner} won this round!`, { ...big, fill: winner, fontSize: big.fontSize * getRatio() }, { zIndex: layers.FOREGROUND })
  text.scale.set(1 / getRatio())
  roundEnd.originalSize = big.fontSize * getRatio()

  text.position.set(-300, 200)
  text.anchor.set(0.5)
  roundEnd.behaviors.winnerTextAnimation = roundWinnerTextAnimation()

  const { players } = gameState
  const matchWinnerCount = getMatchWinners(players, scoreToWin(players)).length

  roundEnd.behaviors.pause = matchWinnerCount > 0
    ? pauseAndTransitionToMatchEnd()
    : pauseAndTransitionToLobby()
}

const pauseAndTransitionToMatchEnd = () => ({
  timer: Timer.create(TIME_UNTIL_ROUND_END_RESTARTS),
  run:   ({ timer }) => timer.run() && transitionToMatchEnd(),
})

const pauseAndTransitionToLobby = () => ({
  timer: Timer.create(TIME_UNTIL_ROUND_END_RESTARTS),
  run:   (b) => {
    if (b.timer.run()) {
      Object
        .values(gameState.controllers)
        .forEach((controller) => {
          controller.send({ event: EVENTS.RTC.ROUND_END, payload: {} })
        })

      createLobby(gameState.gameCode, Object.values(gameState.players))
    }
  },
})

const roundWinnerTextAnimation = () => ({
  tick: 0,
  init: (b, e) => {
    b.animation = createEaseInAndOut({
      start:    -(e.text.width / 2),
      end:      GAME_WIDTH + (e.text.width / 2),
      duration: 120,
    })
  },
  run: (b, e) => {
    e.text.position.x = b.animation(b.tick)
    b.tick += 1
  },
})
