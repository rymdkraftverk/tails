import * as l1 from 'l1'
import * as PIXI from 'pixi.js'
import R from 'ramda'
import Scene from './Scene'
import explode from './particleEmitter/explode'
import { transitionToRoundEnd } from './roundEnd'
import gameState, { CurrentState } from './gameState'
import Layer from './util/layer'
import { GAME_WIDTH, GAME_HEIGHT } from './rendering'
import GameEvent from './util/gameEvent'
import { addEntityToTree, nearestNeighbour } from './kd-tree'
import Sound from './util/sound'

const GENERATE_HOLE_MAX_TIME = 300
const GENERATE_HOLE_MIN_TIME = 60

const HOLE_LENGTH_MAX_TIME = 30
const HOLE_LENGTH_MIN_TIME = 10

const middle = (displayObject, dim, prop) =>
  (displayObject.toGlobal(new PIXI.Point(0, 0))[dim] / l1.getScale()) +
  (displayObject.hitArea[prop] / 2)

export const createTrail = ({
  player, speed, speedMultiplier,
}) => ({
  id:       `createTrail-${player.playerId}`,
  duration: 2,
  loop:     true,
  onInit:   ({ data }) => {
    data.parent = new PIXI.Container()
    l1.add(data.parent, {
      parent: l1.get(Scene.GAME),
    })
  },
  onComplete: ({ data }) => {
    if (player.preventTrail) {
      return
    }

    const trailE = new PIXI.Sprite(l1.getTexture(`circle-${player.color}`))
    l1.add(
      trailE,
      {
        parent: data.parent,
        labels: ['trail'],
      },
    )

    trailE.active = false
    trailE.player = player.playerId

    trailE.scale.set(speed / speedMultiplier / 2)

    // Find the middle of the player so that
    // we can put the trails' middle point in the same spot
    trailE.x = middle(player, 'x', 'width') - (trailE.width / 2)
    trailE.y = middle(player, 'y', 'height') - (trailE.height / 2)

    l1.addBehavior(activate(trailE))

    const options = {
      getCoord: (e, dim) => e[dim],
    }
    gameState.kdTree = addEntityToTree(options, gameState.kdTree, trailE)
  },
})

/*
 * This behavior is needed so that the player wont immediately collide with its own tail.
 */
const activate = trail => ({
  duration:   15,
  onComplete: () => {
    trail.active = true
  },
})

const holeMaker = (player, speed, speedMultiplier) => ({
  id:       `holeMaker-${player.playerId}`,
  duration: l1.getRandomInRange(
    Math.ceil(HOLE_LENGTH_MIN_TIME * (speedMultiplier / speed)),
    Math.ceil(HOLE_LENGTH_MAX_TIME * (speedMultiplier / speed)),
  ),
  onInit: () => {
    player.preventTrail = true
  },
  onComplete: () => {
    player.preventTrail = false
    l1.addBehavior(createHoleMaker(player, speed, speedMultiplier))
  },
})

export const createHoleMaker = (player, speed, speedMultiplier) => ({
  id:       `createHoleMaker-${player.playerId}`,
  duration: l1.getRandomInRange(
    GENERATE_HOLE_MIN_TIME,
    GENERATE_HOLE_MAX_TIME,
  ),
  onComplete: () => {
    l1.addBehavior(holeMaker(player, speed, speedMultiplier))
  },
})

export const collisionCheckerTrail = (player, speedMultiplier) => ({
  id:         `collisionCheckerTrail-${player.playerId}`,
  duration:   2,
  loop:       true,
  onComplete: () => {
    const isColliding = R.curry(l1.isColliding)(player)

    const options = {
      earlyReturn: isColliding,
      filter:      t => t.active || t.player !== player.playerId,
      getCoord:    (e, dimension) => e[dimension],
    }

    const closestOrFirstCollidingEntity = nearestNeighbour(options, gameState.kdTree, player)

    if (closestOrFirstCollidingEntity && isColliding(closestOrFirstCollidingEntity)) {
      killPlayer(player, speedMultiplier)
      checkPlayersAlive()
    }
  },
})

const killPlayer = (player, speedMultiplier) => {
  const {
    textures,
    config,
  } = explode({
    degrees:     player.degrees,
    scaleFactor: (speedMultiplier / player.speed),
    radius:      player.width,
    x:           l1.getGlobalPosition(player).x,
    y:           l1.getGlobalPosition(player).y,
  })

  const particleContainer = new PIXI.Container()
  l1.add(
    particleContainer,
    {
      parent: l1.get(Scene.GAME),
      zIndex: Layer.FOREGROUND + 1,
    },
  )
  // eslint-disable-next-line no-new
  new PIXI.particles.Emitter(
    particleContainer,
    textures.map(l1.getTexture),
    config,
  )

  l1.sound({
    src:    Sound.EXPLOSION,
    volume: 0.6,
  })

  player.killed = true

  const behaviorsToRemove = [
    `collisionCheckerTrail-${player.playerId}`,
    `collisionCheckerWalls-${player.playerId}`,
    `createHoleMaker-${player.playerId}`,
    `holeMaker-${player.playerId}`,
    `createTrail-${player.playerId}`,
    `move-${player.playerId}`,
    `pivot-${player.playerId}`,
  ]

  R.forEach(
    l1.removeBehavior,
    behaviorsToRemove,
  )

  gameState.events.emit(GameEvent.PLAYER_COLLISION, player.color)
  player.event.emit(GameEvent.PLAYER_COLLISION)
}

export const collisionCheckerWalls = ({
  player, speedMultiplier, wallThickness,
}) => ({
  id:         `collisionCheckerWalls-${player.playerId}`,
  duration:   2,
  loop:       true,
  onComplete: () => {
    const x = player.toGlobal(new PIXI.Point(0, 0)).x / l1.getScale()
    const y = player.toGlobal(new PIXI.Point(0, 0)).y / l1.getScale()
    if (
      x < wallThickness ||
      x > GAME_WIDTH - wallThickness - player.hitArea.width ||
      y < wallThickness ||
      y > GAME_HEIGHT - wallThickness - player.hitArea.height) {
      killPlayer(player, speedMultiplier)
      checkPlayersAlive()
    }
  },
})

const checkPlayersAlive = () => {
  const playersAlive = l1
    .getByLabel('player')
    .filter(p => !p.killed)

  if (playersAlive.length === 1 && gameState.currentState === CurrentState.PLAYING_ROUND) {
    gameState.lastRoundResult.winner = playersAlive[0].color
    gameState.lastRoundResult.playerFinishOrder =
            gameState.lastRoundResult.playerFinishOrder.concat([playersAlive[0].l1.id])

    transitionToRoundEnd()
  }
}
