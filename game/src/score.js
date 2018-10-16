import _ from 'lodash/fp'
import { Event, Color, Channel } from 'common'
import * as l1 from 'l1'
import * as PIXI from 'pixi.js'
import R from 'ramda'
import Scene from './Scene'
import { MAX_PLAYERS_ALLOWED } from '.'
import { scoreToWin } from './game'
import delay from './delay'
import * as TextStyle from './util/textStyle'
import { transitionToMatchEnd } from './matchEnd'
import Layer from './util/layer'
import gameState from './gameState'

const WORM_START_Y = 80
const PLAYER_SPACING = 64
const WORM_START_X = 40
const GOAL_X = 1100
const GOAL_Y = 70
const ANIMATION_DURATION = 60

export const transitionToScoreScene = () => {
  const scoreScene = new PIXI.Container()
  l1.add(
    scoreScene,
    {
      id: Scene.SCORE,
    },
  )

  const goal = new PIXI.Sprite(l1.getTexture('goal-flag'))
  l1.add(
    goal,
    {
      parent: scoreScene,
      zIndex: Layer.BACKGROUND,
    },
  )

  goal.x = GOAL_X
  goal.y = GOAL_Y
  goal.scale.set(1.5)

  const goalText = new PIXI.Text(
    scoreToWin(gameState.players),
    {
      ...TextStyle.BIG,
      fontSize: TextStyle.BIG * l1.getScale(),
      fill:     'white',
    },
  )
  l1.add(
    goalText,
    {
      parent: scoreScene,
    },
  )
  goalText.position.set(
    GOAL_X + 10,
    GOAL_Y - 60,
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
        l1.destroy(scoreScene)
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
    x: previousX, y, texture,
  })

  console.log('player', player)

  if (player) {
    const playerScore = new PIXI.Text(
      player.score,
      {
        ...TextStyle.SMALL,
        fontSize: TextStyle.SMALL.fontSize * l1.getScale(),
        fill:     'white',
      },
    )
    l1.add(
      playerScore,
      {
        parent: head,
        zIndex: 1,
      },
    )
    playerScore.position.set(
      0,
      6,
    )
  }

  const tail = new PIXI.Graphics()
  l1.add(
    tail,
    {
      parent: l1.get(Scene.SCORE),
      zIndex: -10,
    },
  )

  tail.position.set(
    0,
    y,
  )

  l1.addBehavior(animate({
    head,
    tail,
    fromX: head.toGlobal(new PIXI.Point(0, 0)).x / l1.getScale(),
    toX:   currentX,
    color: (player && player.color) || 'none',
  }))
}

const createHead = ({
  x, y, texture,
}) => {
  const head = new PIXI.Sprite(l1.getTexture(texture))

  l1.add(
    head,
    {
      parent: l1.get(Scene.SCORE),
    },
  )

  head.x = x
  head.y = y
  return head
}

const animate = ({
  head, tail, fromX, toX, color,
}) => ({
  duration: ANIMATION_DURATION,
  onUpdate: () => {
    const diffX = (toX - fromX) / ANIMATION_DURATION
    head.x += diffX
    const x = head.toGlobal(new PIXI.Point(0, 0)).x / l1.getScale()
    tail.clear()
    tail
      // Pixi.Graphics requires color code to start with 0x instead of #
      .beginFill(`0x${Color[color].substring(1, Color[color].length)}`, 1)
      .moveTo(0, 0)
      .lineTo(x + (head.width / 2), 0)
      .lineTo(x + (head.width / 2), 0 + head.height)
      .lineTo(0, 0 + head.height)
      .lineTo(0, 0)
      .endFill()
  },
})
