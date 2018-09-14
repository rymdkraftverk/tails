import l1 from 'l1'
import { Event, Color, Channel } from 'common'

import { GAME_WIDTH, GAME_HEIGHT } from './rendering'
import { createSine } from './magic'
import { resetPlayersScore, getPlayersWithHighestScore } from './game'
import firework from './particleEmitter/firework'
import { transitionToLobby } from './lobby'
import * as TextStyle from './util/textStyle'
import Layer from './util/layer'
import Scene from './Scene'
import gameState from './gameState'

const TIME_UNTIL_LOBBY_TRANSITION = 500

export const transitionToMatchEnd = () => {
  l1
    .getAllEntities()
    .filter(e => e.id !== 'background')
    .forEach(l1.destroy)

  const matchEnd = l1.entity({
    id: Scene.MATCH_END,
    x:  GAME_WIDTH / 2,
    y:  200,
  })

  const { players } = gameState
  const matchWinners = getPlayersWithHighestScore(players)

  if (matchWinners.length === 1) {
    const [{ color }] = matchWinners
    const text = l1.text({
      parent: matchEnd,
      text:   `${color} is the champion!`,
      zIndex: Layer.FOREGROUND,
      style:  {
        ...TextStyle.BIG,
        fontSize: 38,
        fill:     Color[color],
      },
    })
    text.asset.anchor.set(0.5)

    l1.addBehavior(
      textMovement(),
      text,
    )

    const fireworkCreator = l1.entity({ parent: matchEnd })
    l1.addBehavior(
      createFireworks(matchWinners[0].color),
      fireworkCreator,
    )
  } else {
    const text = l1.text({
      parent: matchEnd,
      text:   'It\'s a draw, better luck next time!',
      zIndex: Layer.FOREGROUND,
      style:  {
        ...TextStyle.BIG,
        fontSize: 38,
        fill:     'white',
      },
    })
    text.asset.anchor.set(0.5)
  }

  l1.addBehavior(
    pause(),
    matchEnd,
  )
}

const textMovement = () => ({
  data: {
    sine: createSine({
      start: 1,
      end:   1.2,
      speed: 120,
    }),
  },
  onInit: ({ data, entity }) => {
    data.originalSize = entity.asset.style.fontSize
  },
  onUpdate: ({ entity, data, counter }) => {
    const scale = data.sine(counter)
    l1.scaleText(data.originalSize * scale, entity)
  },
})

const createFireworks = color => ({
  endTime:    l1.getRandomInRange(5, 10),
  loop:       true,
  onComplete: ({ entity }) => {
    const x = l1.getRandomInRange(100, GAME_WIDTH - 100)
    const y = l1.getRandomInRange(100, GAME_HEIGHT - 100)
    l1.particles({
      ...firework({
        color,
        x,
        y,
      }),
      zIndex: Layer.BACKGROUND,
      parent: entity,
    })
  },
})

const pause = () => ({
  endTime:    TIME_UNTIL_LOBBY_TRANSITION,
  onComplete: () => {
    Object
      .values(gameState.controllers)
      .forEach((controller) => {
        controller.send(Channel.RELIABLE, { event: Event.Rtc.ROUND_END, payload: {} })
      })

    gameState.players = resetPlayersScore(gameState.players)

    l1.destroy(Scene.MATCH_END)

    transitionToLobby(gameState.gameCode, Object.values(gameState.players))
  },
})

window.debug = {
  ...window.debug,
  transitionToLobby,
  transitionToMatchEnd,
}
