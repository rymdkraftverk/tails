import * as l1 from 'l1'
import * as PIXI from 'pixi.js'
import { Emitter } from 'pixi-particles'
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
import { playTrack } from './music'
import Sound from './constant/sound'

const TIME_UNTIL_LOBBY_TRANSITION = 500

let fireworkEmitters = []

export const transitionToMatchEnd = () => {
  // this cleans up things to prevent this from crashing when calling from
  // console window. This is already done on round end, this clean up is not
  // necessary during standard game flow
  // TODO consider using event based solution to separate concerns
  l1.destroy(Scene.GAME)
  l1.getAllBehaviors()
    .forEach(l1.removeBehavior)

  l1
    .getAll()
    .filter(e => e.l1.id !== 'background')
    .forEach(l1.destroy)

  const matchEnd = new PIXI.Container()
  l1.add(
    matchEnd,
    {
      id: Scene.MATCH_END,
    },
  )

  const matchWinners = playerRepository.getWithHighestScores()

  if (matchWinners.length === 1) {
    const [{ color }] = matchWinners

    const text = new PIXI.Text(
      `${color} is the champion!`,
      {
        ...TextStyle.BIG,
        fontSize: 38,
        fill:     Color[color],
      },
    )
    l1.add(
      text,
      {
        parent: matchEnd,
        zIndex: Layer.FOREGROUND,
      },
    )

    text.x = GAME_WIDTH / 2
    text.y = 200
    text.anchor.set(0.5)

    l1.addBehavior(textMovement(text))

    const fireworkCreator = new PIXI.Container()
    l1.add(
      fireworkCreator,
      {
        parent: matchEnd,
        zIndex: Layer.BACKGROUND,
        id:     'fireworks',
      },
    )

    l1.addBehavior(createFireworks(fireworkCreator, matchWinners[0].color))
  } else {
    const text = new PIXI.Text(
      'It\'s a draw, better luck next time!',
      {
        ...TextStyle.BIG,
        fontSize: 38,
        fill:     'white',
      },
    )
    l1.add(
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

  l1.addBehavior(pause())
}

const textMovement = text => ({
  id:   'textMovement',
  data: {
    // This will not look good if the user resizes the window while this animation is running
    sine: createSine({
      start: text.scale.x,
      end:   text.scale.x * 1.2,
      speed: 120,
    }),
  },
  onUpdate: ({ data, counter }) => {
    const scale = data.sine(counter)
    text.scale.set(scale)
  },
})

const createFireworks = (creator, color) => ({
  id:       'createFireworks',
  duration: l1.getRandomInRange(5, 10),
  loop:     true,
  onInit:   ({ data }) => {
    playTrack(null)
    data.fireWorksSound = l1.sound({
      src:    Sound.FIREWORK,
      volume: 1,
      loop:   true,
    })
  },
  onRemove: ({ data: { fireWorksSound } }) => {
    fireWorksSound.stop()
  },
  onComplete: () => {
    const x = l1.getRandomInRange(100, GAME_WIDTH - 100)
    const y = l1.getRandomInRange(100, GAME_HEIGHT - 100)

    const {
      textures,
      config,
    } = firework({
      color,
      x,
      y,
    })
    const fireworkEmitter = new Emitter(
      creator,
      textures.map(l1.getTexture),
      config,
    )
    fireworkEmitters = fireworkEmitters.concat(fireworkEmitter)
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

    l1.removeBehavior('createFireworks')
    l1.removeBehavior('textMovement')

    // This is needed due to pixi-particles crashing if you destroy
    // the parent of an emitter while particles are still active
    fireworkEmitters.forEach((e) => {
      e.cleanup()
      e.destroy()
    })
    fireworkEmitters = []

    l1.destroy(Scene.MATCH_END)

    transitionToLobby(state.gameCode, state.players)
  },
})

window.debug = {
  ...window.debug,
  transitionToLobby,
  transitionToMatchEnd,
}
