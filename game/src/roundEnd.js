import { Entity, Timer, Text } from 'l1'
import { EVENTS } from 'common'
import { createEaseInAndOut } from './magic'
import { transitionToLobby } from './lobby'
import { gameState, GAME_WIDTH, getRatio } from '.'
import { big } from './util/textStyles'
import layers from './util/layers'

const TIME_UNTIL_ROUND_END_RESTARTS = 240

export function transitionToRoundEnd() {
  const roundEnd = Entity.addChild(
    Entity.getRoot(),
    {
      id: 'round-end',
      x:  -300,
      y:  200,
    },
  )
  const { winner } = gameState.lastRoundResult
  const text = Text.show(
    roundEnd,
    {
      text:   `Winner is ${winner}!`,
      zIndex: layers.FOREGROUND,
      style:  {
        ...big,
        fill:     winner,
        fontSize: big.fontSize * getRatio(),
      },
    },
  )
  text.scale.set(1 / getRatio())
  roundEnd.originalSize = big.fontSize * getRatio()

  text.anchor.set(0.5)
  roundEnd.behaviors.winnerTextAnimation = roundWinnerTextAnimation()

  roundEnd.behaviors.pause = pause()
}

const pause = () => ({
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
