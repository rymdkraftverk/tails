import { Entity, Timer } from 'l1'
import { EVENTS } from 'common'
import { createEaseInAndOut } from './magic'
import { createLobby } from './lobby'
import { gameState, GAME_WIDTH, getRatio } from '.'
import { big } from './util/textStyles'

const TIME_UNTIL_GAME_RESTARTS = 240

export function transitionToGameover() {
  const gameover = Entity.create('game-over')
  const { winner } = gameState.lastResult
  const text = Entity.addText(gameover, `Winner is ${winner}!`, { ...big, fill: winner, fontSize: big.fontSize * getRatio() }, { zIndex: 100 })
  text.scale.set(1 / getRatio())
  gameover.originalSize = big.fontSize * getRatio()

  text.position.set(-300, 200)
  text.anchor.set(0.5)
  gameover.behaviors.winnerTextAnimation = winnerTextAnimation()

  gameover.behaviors.pause = pause()
}

const pause = () => ({
  timer: Timer.create(TIME_UNTIL_GAME_RESTARTS),
  run:   (b) => {
    if (b.timer.run()) {
      Object
        .values(gameState.controllers)
        .forEach((controller) => {
          controller.send({ event: EVENTS.RTC.GAME_OVER, payload: {} })
        })

      createLobby(gameState.gameCode, Object.values(gameState.players))
    }
  },
})

const winnerTextAnimation = () => ({
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
