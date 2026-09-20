import * as l2 from 'l2'
import type { Behavior } from 'l2'
import * as PIXI from 'pixi.js'
import { emit } from './particles'
import { Event, Color, Channel } from 'common'

import { GAME_WIDTH, GAME_HEIGHT } from './constant/rendering'
import { createSine } from './magic'
import firework from './particleEmitter/firework'
import { transitionToLobby } from './lobby'
import * as TextStyle from './constant/textStyle'
import Layer from './constant/layer'
import Scene from './Scene'
import { state } from './state'
import playerRepository from './repository/player'
import { playTrack, stopTrack } from 'l2/sound'
import { Track } from './constant/sound'

const TIME_UNTIL_LOBBY_TRANSITION = 500

const fireworkEmitters: ReturnType<typeof emit>[] = []

export const transitionToMatchEnd = () => {
  // this cleans up things to prevent this from crashing when calling from
  // console window. This is already done on round end, this clean up is not
  // necessary during standard game flow
  l2.destroy(Scene.GAME)
  l2.getAllBehaviors()
    .forEach(behavior => l2.removeBehavior(behavior))

  l2
    .getAll()
    .filter(e => l2.getId(e) !== 'background')
    .forEach((displayObject) => {
      if (!l2.isDestroyed(displayObject)) {
        l2.destroy(displayObject)
      }
    })

  const matchEnd = new PIXI.Container()
  l2.add(
    matchEnd,
    {
      id: Scene.MATCH_END,
    },
  )

  const matchWinners = playerRepository.getWithHighestScores()

  if (matchWinners.length === 1) {
    const [{ color }] = matchWinners

    const text = new PIXI.Text({
      text:  `${color} is the champion!`,
      style: {
        ...TextStyle.BIG,
        fontSize: 38,
        fill:     Color[color],
      },
    })
    l2.add(
      text,
      {
        parent: matchEnd,
        zIndex: Layer.FOREGROUND,
      },
    )

    text.x = GAME_WIDTH / 2
    text.y = 200
    text.anchor.set(0.5)

    l2.addBehavior(textMovement(text))

    const fireworkCreator = new PIXI.Container()
    l2.add(
      fireworkCreator,
      {
        parent: matchEnd,
        zIndex: Layer.BACKGROUND,
        id:     'fireworks',
      },
    )

    l2.addBehavior(createFireworks(fireworkCreator, matchWinners[0].color))
  } else {
    const text = new PIXI.Text({
      text:  'It\'s a draw, better luck next time!',
      style: {
        ...TextStyle.BIG,
        fontSize: 38,
        fill:     'white',
      },
    })
    l2.add(
      text,
      {
        parent: matchEnd,
        zIndex: Layer.FOREGROUND,
      },
    )
    text.x = GAME_WIDTH / 2
    text.y = 200
    text.anchor.set(0.5)
  }

  l2.addBehavior(pause())
}

const textMovement = (text: PIXI.Text) => ({
  id:   'textMovement',
  data: {
    // This will not look good if the user resizes the window while this animation is running
    sine: createSine({
      start: text.scale.x,
      end:   text.scale.x * 1.2,
      speed: 120,
    }),
  },
  onUpdate: ({ data, counter }: Behavior<{ sine: (t: number) => number }>) => {
    const scale = data.sine(counter)
    text.scale.set(scale)
  },
})

const createFireworks = (creator: PIXI.Container, color: keyof typeof Color) => ({
  id:       'createFireworks',
  duration: l2.getRandomInRange(5, 10),
  loop:     true,
  onInit:   () => {
    playTrack(Track.FIREWORKS)
  },
  onRemove: () => {
    stopTrack()
  },
  onComplete: () => {
    const x = l2.getRandomInRange(100, GAME_WIDTH - 100)
    const y = l2.getRandomInRange(100, GAME_HEIGHT - 100)

    const {
      textures,
      config,
    } = firework({
      color,
      x,
      y,
    })
    const fireworkEmitter = emit({
      parent:   creator,
      textures: textures.map(l2.getTexture),
      ...config,
    })
    fireworkEmitters.push(fireworkEmitter)
  },
})

const pause = () => ({
  duration:   TIME_UNTIL_LOBBY_TRANSITION,
  onComplete: () => {
    state
      .players
      .forEach((player) => {
        player.send(Channel.RELIABLE, { event: Event.ROUND_END, payload: {} })
      })

    playerRepository.resetScores()

    l2.removeBehavior('createFireworks')
    l2.removeBehavior('textMovement')

    // Fireworks outlive their emitter's lifetime, so stop them before
    // the scene they are drawn into goes away
    fireworkEmitters.splice(0)
.forEach((fireworkEmitter) => {
      fireworkEmitter.destroy()
    })

    l2.destroy(Scene.MATCH_END)

    transitionToLobby(state.gameCode, state.players)
  },
})

window.debug = {
  ...window.debug,
  transitionToLobby,
  transitionToMatchEnd,
}
