import { Entity, Timer } from 'l1'
import { createLobby, players } from './lobby'
import { game } from '.'
import { big } from './util/text'

export function transitionToGameover() {
  const gameover = Entity.create('game-over')
  const { winner } = game.lastResult
  const text = Entity.addText(gameover, `Winner is ${winner}!`, big(winner), { zIndex: 100 })
  text.position.x = 200
  text.position.y = 200

  gameover.behaviors.pause = pause()
}

const pause = () => ({
  timer: Timer.create(100),
  run:   (b) => {
    if (b.timer.run()) {
      createLobby(game.gameCode, Object.values(players))
    }
  },
})
