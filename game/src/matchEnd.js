import { Entity, Timer, Text } from 'l1'
import { Event, Color } from 'common'
import { gameState, GAME_WIDTH } from '.'
import { getMatchWinners, scoreToWin, resetPlayersScore } from './game'
import { transitionToLobby } from './lobby'
import { big } from './util/textStyles'
import layers from './util/layers'
import Scene from './Scene'

const TIME_UNTIL_MATCH_END_TRANSITION = 240

const createText = (entity, content, color) => {
  const text = Text.show(
    entity,
    {
      text:   content,
      zIndex: layers.FOREGROUND,
      style:  {
        ...big,
        fill: color,
      },
    },
  )
  text.anchor.set(0.5)

  return text
}

const createTextDraw = matchEndEntity => createText(matchEndEntity, 'It\'s a draw, better luck next time!', 'white')
const createTextWinner = (matchEndEntity, [{ color }]) => createText(matchEndEntity, `${color} is the champion!`, Color[color])

export const transitionToMatchEnd = () => {
  const matchEnd = Entity.addChild(
    Entity.getRoot(),
    {
      id: Scene.MATCH_END,
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

  matchEnd.behaviors.pause = pause()
}

const pause = () => ({
  timer: Timer.create({ duration: TIME_UNTIL_MATCH_END_TRANSITION }),
  run:   ({ timer }) => {
    if (Timer.run(timer)) {
      Object
        .values(gameState.controllers)
        .forEach((controller) => {
          controller.send({ event: Event.Rtc.ROUND_END, payload: {} })
        })

      gameState.players = resetPlayersScore(gameState.players)

      Entity.destroy(Scene.MATCH_END)

      transitionToLobby(gameState.gameCode, Object.values(gameState.players))
    }
  },
})

window.debug = { ...window.debug, transitionToLobby, transitionToMatchEnd }