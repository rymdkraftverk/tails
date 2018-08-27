import _ from 'lodash/fp'
import { COLOR } from 'common'
import { Entity, Sprite, Graphics, Text } from 'l1'
import Scene from './Scene'
import { MAX_PLAYERS_ALLOWED, gameState } from '.'
import { scoreToWin } from './game'
import { small } from './util/textStyles'

const WORM_START_Y = 80
const PLAYER_SPACING = 64
const WORM_START_X = 40
const GOAL_X = 1100
const GOAL_Y = 60
const ANIMATION_DURATION = 60

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
      },
    )
  goalSprite.scale.set(1.5)

  // eslint-disable-next-line lodash-fp/no-unused-result
  _
    .times(createPlayer, MAX_PLAYERS_ALLOWED)
}

const getX = (score, goal) => {
  const ratio = score / goal
  return WORM_START_X + ((GOAL_X - WORM_START_X) * ratio)
}

const createPlayer = (index) => {
  const currentColor = Object.keys(COLOR)[index]

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

  const head = Entity
    .addChild(
      Entity.get(Scene.SCORE),
      {
        id: (player && player.playerId) || null,
        x:  previousX,
        y,
      },
    )
  const sprite = Sprite.show(
    head,
    { texture },
  )

  sprite.scale.set(2)

  if (player) {
    const playerScore = Entity
      .addChild(
        head,
        {
          x: 0,
          y: 6,
        },
      )

    Text.show(
      playerScore,
      {
        text:  player.score,
        style: {
          ...small,
          fill: 'white',
        },
        zIndex: 1,
      },
    )
  }

  const tail = Entity
    .addChild(
      Entity.get(Scene.SCORE),
      {
        x: 0,
        y,
      },
    )

  const tailGraphics = Graphics.create(tail, { zIndex: -10 })

  head.behaviors.animate = animate(tailGraphics, Entity.getX(head), currentX, (player && player.color) || 'none')
}

const animate = (tailGraphics, fromX, toX, color) => ({
  tick: 0,
  run:  (b, e) => {
    const diffX = (toX - fromX) / ANIMATION_DURATION
    Entity.setX(e, Entity.getX(e) + diffX)
    tailGraphics.clear()
    // Pixi.Graphics requires color code to start with 0x instead of #
    tailGraphics.beginFill(`0x${COLOR[color].substring(1, COLOR[color].length)}`, 1)
    tailGraphics.moveTo(0, 0)
    tailGraphics.lineTo(Entity.getX(e) + (e.asset.width / 2), 0)
    tailGraphics.lineTo(Entity.getX(e) + (e.asset.width / 2), 0 + e.asset.height)
    tailGraphics.lineTo(0, 0 + e.asset.height)
    tailGraphics.lineTo(0, 0)
    tailGraphics.endFill()

    b.tick += 1
    if (b.tick >= ANIMATION_DURATION) {
      // eslint-disable-next-line fp/no-delete
      delete e.behaviors.animate
    }
  },
})
