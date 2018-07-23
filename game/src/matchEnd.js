import { Entity, Timer, Text } from 'l1'
import { EVENTS } from 'common'
import { gameState, getRatio, GAME_WIDTH } from '.'
import { getMatchWinners, scoreToWin, resetPlayersScore } from './game'
import { transitionToLobby } from './lobby'
import { big } from './util/textStyles'
import layers from './util/layers'

const TIME_UNTIL_MATCH_END_TRANSITION = 240

const createText = (entity, content, color) => {
  const text = Text.show(
    entity,
    {
      text:   content,
      zIndex: layers.FOREGROUND,
      style:  {
        ...big,
        fill:     color,
        fontSize: big.fontSize * getRatio(),
      },
    },
  )

  text.scale.set(1 / getRatio())
  text.anchor.set(0.5)

  return text
}

const createTextDraw = matchEndEntity => createText(matchEndEntity, 'It\'s a draw, better luck next time!', 'white')
const createTextWinner = (matchEndEntity, [{ color }]) => createText(matchEndEntity, `${color} is the champion!`, color)

export const transitionToMatchEnd = () => {
  Entity.getAll()
    .filter(e => e.id !== 'background')
    .forEach(Entity.destroy)

  const matchEnd = Entity.addChild(
    Entity.getRoot(),
    {
      id: 'match-end',
      x:  GAME_WIDTH / 2,
      y:  200,
    },
  )

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
  timer: Timer.create({ duration: TIME_UNTIL_MATCH_END_TRANSITION }),
  run:   ({ timer }) => {
    if (Timer.run(timer)) {
      Object
        .values(gameState.controllers)
        .forEach((controller) => {
          controller.send({ event: EVENTS.RTC.ROUND_END, payload: {} })
        })

      gameState.players = resetPlayersScore(gameState.players)
      transitionToLobby(gameState.gameCode, Object.values(gameState.players))
    }
  },
})