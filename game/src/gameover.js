import { Entity, Timer } from 'l1'
import { EVENTS } from 'common'
import { createEaseInAndOut } from './magic'
import { createLobby, players } from './lobby'
import { game, GAME_WIDTH } from '.'
import { big } from './util/textStyles'
import { connSend } from './conn'

const TIME_UNTIL_GAME_RESTARTS = 240

export function transitionToGameover() {
  const gameover = Entity.create('game-over')
  const { winner } = game.lastResult
  const text = Entity.addText(gameover, `Winner is ${winner}!`, { ...big, fill: winner }, { zIndex: 100 })
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
        .values(game.controllers)
        .forEach(({ controllerId }) =>
          connSend(game.conn, controllerId, { event: EVENTS.RTC.GAME_OVER, payload: {} }))

      createLobby(game.gameCode, Object.values(players))
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
