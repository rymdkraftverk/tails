import { Entity, Timer } from 'l1'
import { EVENTS } from 'common'
import { gameState, getRatio, GAME_WIDTH } from '.'
import { getMatchWinners, scoreToWin, resetPlayersScore } from './game'
import { createLobby } from './lobby'
import { big } from './util/textStyles'
import layers from './util/layers'

const TIME_UNTIL_MATCH_END_TRANSITION = 240

const createText = (entity, content, color) => {
  const text = Entity.addText(
    entity,
    content,
    {
      ...big,
      fill:     color,
      fontSize: big.fontSize * getRatio(),
    },
    {
      zIndex: layers.FOREGROUND,
    },
  )
  text.scale.set(1 / getRatio())
  text.position.set(GAME_WIDTH / 2, 200)
  text.anchor.set(0.5)

  return text
}

const createTextDraw = matchEndEntity => createText(matchEndEntity, 'It\'s a draw, better luck next time!', 'white')
const createTextWinner = (matchEndEntity, [{ color }]) => createText(matchEndEntity, `${color} is the champion!`, color)

export const transitionToMatchEnd = () => {
  Entity.getAll()
    .filter(e => e.id !== 'background')
    .forEach(Entity.destroy)

  const matchEnd = Entity.create('match-end')
  const { players } = gameState
  const matchWinners = getMatchWinners(players, scoreToWin(players))
  if (matchWinners.length === 1) {
    createTextWinner(matchEnd, matchWinners)
  } else {
    createTextDraw(matchEnd)
  }

  matchEnd.originalSize = big.fontSize * getRatio()
  matchEnd.behaviors.pause = pause()
}

const pause = () => ({
  timer: Timer.create(TIME_UNTIL_MATCH_END_TRANSITION),
  run:   (b) => {
    if (b.timer.run()) {
      Object
        .values(gameState.controllers)
        .forEach((controller) => {
          controller.send({ event: EVENTS.RTC.ROUND_END, payload: {} })
        })

      gameState.players = resetPlayersScore(gameState.players)
      createLobby(gameState.gameCode, Object.values(gameState.players))
    }
  },
})
