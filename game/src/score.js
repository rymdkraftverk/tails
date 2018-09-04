import _ from 'lodash/fp'
import { Event, Color, Channel } from 'common'
import { Entity, Sprite, Graphics, Text, Filter } from 'l1'
import R from 'ramda'
import Scene from './Scene'
import { MAX_PLAYERS_ALLOWED } from '.'
import { scoreToWin } from './game'
import delay from './delay'
import * as TextStyle from './util/textStyle'
import { transitionToMatchEnd } from './matchEnd'
import Layer from './util/layer'
import gameState from './gameState'
import convertColorHex from './util/convertColorHex'

const WORM_START_Y = 80
const PLAYER_SPACING = 64
const WORM_START_X = 60
const GOAL_X = 1100
const GOAL_Y = 70
const ANIMATION_DURATION = 60

const HEAD_HEIGHT = 48
const HEAD_WIDTH = 48

export const transitionToScoreScene = () => {
  const scoreScene = Entity
    .addChild(
      Entity.getRoot(),
      {
        id: Scene.SCORE,
      },
    )
  const goal = Entity
    .addChild(
      scoreScene,
      {
        x: GOAL_X,
        y: GOAL_Y,
      },
    )

  const goalSprite = Sprite
    .show(
      goal,
      {
        texture: 'goal-flag',
        zIndex:  Layer.BACKGROUND,
      },
    )
  goalSprite.scale.set(1.5)

  const goalScore = Entity.addChild(
    goal,
    {
      y: -60,
      x: 10,
    },
  )

  Text.show(
    goalScore,
    {
      text:  scoreToWin(gameState.players),
      style: {
        ...TextStyle.BIG,
        fill: 'white',
      },
    },
  )

  // eslint-disable-next-line lodash-fp/no-unused-result
  _
    .times(createPlayer, MAX_PLAYERS_ALLOWED)

  const {
    players,
    controllers,
  } = gameState

  const winLimit = scoreToWin(players)
  const matchWinnerCount = Object
    .values(players)
    .map(R.prop('score'))
    .filter(s => s >= winLimit)
    .length

  if (matchWinnerCount > 0) {
    delay(120)
      .then(() => {
        Entity.destroy(scoreScene)
        transitionToMatchEnd()
      })
  } else {
    delay(ANIMATION_DURATION)
      .then(() => {
        Object
          .values(controllers)
          .forEach((controller) => {
            controller.send(Channel.RELIABLE, { event: Event.Rtc.ROUND_END, payload: {} })
          })
      })
  }
}

const getX = (score, goal) => {
  const ratio = score / goal
  return WORM_START_X + ((GOAL_X - WORM_START_X) * ratio)
}

const createPlayer = (index) => {
  const currentColor = Object.keys(Color)[index]

  const player = Object
    .values(gameState.players)
    .find(({ color }) => color === currentColor)

  let texture

  if (!player) {
    texture = 'circle-none'
  } else {
    texture = `circle-${player.color}`
  }

  const y = WORM_START_Y + (index * PLAYER_SPACING)

  const goalScore = scoreToWin(gameState.players)

  const previousX = getX((player && player.previousScore) || 0, goalScore)
  const currentX = getX((player && player.score) || 0, goalScore)

  const head = createHead({
    x:          previousX,
    y,
    texture,
    color:      currentColor,
    shouldGlow: !!player,
  })

  if (player) {
    createPlayerScore({ parent: head, score: player.score })
  }

  const tail = Entity
    .addChild(
      Entity.get(Scene.SCORE),
      {
        x: 0,
        y,
      },
    )

  const tailGraphics = Graphics.create(tail, { zIndex: -1 })

  if (player) {
    const glow = Filter.add(
      tail,
      new Filter.Filter.GlowFilter(20, 4, 0, convertColorHex(Color[currentColor]), 0.2),
    )
    glow.color = convertColorHex(Color[currentColor])
  }

  head.behaviors.animate = animate({
    tailGraphics, fromX: Entity.getX(head), toX:   currentX, color: (player && player.color) || 'none',
  })
}

const createHead = ({
  x, y, texture, color, shouldGlow,
}) => {
  const head = Entity
    .addChild(
      Entity.get(Scene.SCORE),
      {
        x,
        y,
        width:  HEAD_WIDTH,
        height: HEAD_HEIGHT,
      },
    )
  Sprite.show(
    head,
    { texture },
  )

  if (shouldGlow) {
    const glow = Filter.add(
      head,
      new Filter.Filter.GlowFilter(20, 4, 0, convertColorHex(Color[color]), 0.2),
    )
    glow.color = convertColorHex(Color[color])
  }

  return head
}

const createPlayerScore = ({ parent, score }) => {
  const playerScore = Entity
    .addChild(
      parent,
      {
        y: 20,
      },
    )

  const text = Text.show(
    playerScore,
    {
      text:  score,
      style: {
        ...TextStyle.SMALL,
        fill: 'white',
      },
      zIndex: 1,
    },
  )
  text.anchor.set(1, 0)
}

const animate = ({
  tailGraphics, fromX, toX, color,
}) => ({
  tick: 0,
  run:  (b, e) => {
    const diffX = (toX - fromX) / ANIMATION_DURATION
    Entity.setX(e, Entity.getX(e) + diffX)
    tailGraphics.clear()
    tailGraphics.beginFill(convertColorHex(Color[color]), 1)
    tailGraphics.moveTo(0, e.height / 4)

    tailGraphics.lineTo(Entity.getX(e) + (e.asset.width / 2), e.height / 4)
    tailGraphics.lineTo(Entity.getX(e) + (e.asset.width / 2), e.height * 1.25)
    tailGraphics.lineTo(0, e.height * 1.25)
    tailGraphics.lineTo(0, e.height / 4)
    tailGraphics.endFill()

    b.tick += 1
    if (b.tick >= ANIMATION_DURATION) {
      // eslint-disable-next-line fp/no-delete
      delete e.behaviors.animate
    }
  },
})
