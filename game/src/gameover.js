import { Entity, Timer } from 'l1'
import { createEaseOut, createEaseIn } from './magic'
import EVENTS from '../../common/events'
import { createLobby, players } from './lobby'
import { game } from '.'
import { big } from './util/textStyles'
import { connSend } from './conn'


const TIME_UNTIL_GAME_RESTARTS = 240

export function transitionToGameover() {
  const gameover = Entity.create('game-over')
  const { winner } = game.lastResult
  const text = Entity.addText(gameover, `Winner is ${winner}!`, { ...big, fill: winner }, { zIndex: 100 })
  text.position.x = 0
  text.position.y = 200
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

const winnerTextAnimationStates = {
  ENTERING: 'ENTERING',
  HOLDING:  'HOLDING',
  EXITING:  'EXITING',
}

const ENTERING_END_X = 300
const HOLDING_END_X = 500
const EXITING_END_X = 1100

const winnerTextAnimation = () => ({
  entrance: createEaseOut(ENTERING_END_X, 4),
  leaving:  createEaseIn(EXITING_END_X, 100000),
  state:    winnerTextAnimationStates.ENTERING,
  run:      (b, e) => {
    if (b.state === winnerTextAnimationStates.ENTERING) {
      if (e.text.position.x >= ENTERING_END_X) {
        b.state = winnerTextAnimationStates.HOLDING
      }
      e.text.position.x += b.entrance(e.text.position.x)
    } else if (b.state === winnerTextAnimationStates.HOLDING) {
      if (e.text.position.x >= HOLDING_END_X) {
        b.state = winnerTextAnimationStates.EXITING
      }
      e.text.position.x += 4
    } else if (b.state === winnerTextAnimationStates.EXITING) {
      e.text.position.x += b.leaving(e.text.position.x)
    }
  },
})

