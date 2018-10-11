import _ from 'lodash/fp'
import { Event, Color, Channel } from 'common'
import l1 from 'l1'
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
  const scoreScene = l1.container({
    id: Scene.SCORE,
  })

  const goal = l1.sprite({
    parent:  scoreScene,
    texture: 'goal-flag',
    zIndex:  Layer.BACKGROUND,
  })

  goal.asset.x = GOAL_X
  goal.asset.y = GOAL_Y
  goal.asset.scale.set(1.5)
  goal.asset.filters = null
  goal.asset.cacheAsBitmap = true

  l1.text({
    parent: scoreScene,
    text:   scoreToWin(gameState.players),
    style:  {
      ...TextStyle.BIG,
      fill: 'white',
    },
  }).asset.position.set(
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

  if (player) {
    l1.text({
      parent: head,
      text:   player.score,
      style:  {
        ...TextStyle.SMALL,
        fill: 'white',
      },
      zIndex: 1,
    }).asset.position.set(
      0,
      6,
    )
  }

  const tail = l1.graphics({
    parent: l1.get(Scene.SCORE),
    zIndex: -10,
  })

  tail.asset.position.set(
    0,
    y,
  )

  l1.addBehavior(
    head,
    animate({
      tail,
      fromX: head.asset.toGlobal(new l1.PIXI.Point(0, 0)).x / l1.getScreenScale(),
      toX:   currentX,
      color: (player && player.color) || 'none',
    }),
  )
}

const createHead = ({
  x, y, texture,
}) => {
  const head = l1.sprite({
    parent: l1.get(Scene.SCORE),
    texture,
  })
  head.asset.x = x
  head.asset.y = y
  return head
}

const animate = ({
  tail, fromX, toX, color,
}) => ({
  duration: ANIMATION_DURATION,
  onUpdate: ({ entity }) => {
    const diffX = (toX - fromX) / ANIMATION_DURATION
    entity.asset.x += diffX
    const x = entity.asset.toGlobal(new l1.PIXI.Point(0, 0)).x / l1.getScreenScale()
    const { asset: graphics } = tail
    graphics.clear()
    graphics
      // Pixi.Graphics requires color code to start with 0x instead of #
      .beginFill(`0x${Color[color].substring(1, Color[color].length)}`, 1)
      .moveTo(0, 0)
      .lineTo(x + (entity.asset.width / 2), 0)
      .lineTo(x + (entity.asset.width / 2), 0 + entity.asset.height)
      .lineTo(0, 0 + entity.asset.height)
      .lineTo(0, 0)
      .endFill()
  },
})
