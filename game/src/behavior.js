import l1 from 'l1'
import R from 'ramda'
import Scene from './Scene'
import explode from './particleEmitter/explode'
import { transitionToRoundEnd } from './roundEnd'
import gameState, { CurrentState } from './gameState'
import { GameEvent } from './game'
import Layer from './util/layer'
import { GAME_WIDTH, GAME_HEIGHT } from './rendering'

const TRAIL_HITBOX_SIZE = 24

const GENERATE_HOLE_MAX_TIME = 300
const GENERATE_HOLE_MIN_TIME = 60

const HOLE_LENGTH_MAX_TIME = 30
const HOLE_LENGTH_MIN_TIME = 10

export const createTrail = ({
  playerId, speed, speedMultiplier,
}) => ({
  endTime:    2,
  loop:       true,
  onComplete: ({ entity }) => {
    if (entity.preventTrail) {
      return
    }
    const width = TRAIL_HITBOX_SIZE * (speed / speedMultiplier)
    const height = TRAIL_HITBOX_SIZE * (speed / speedMultiplier)

    // Find the middle of the player entity so that
    // we can put the trails' middle point in the same spot
    const middleX = l1.getX(entity) + (entity.width / 2)
    const middleY = l1.getY(entity) + (entity.height / 2)

    const trailE = l1.sprite({
      x:       middleX - (width / 2),
      y:       middleY - (height / 2),
      width,
      height,
      parent:  l1.get(Scene.GAME),
      types:   ['trail'],
      texture: `circle-${entity.color}`,
    })
    trailE.active = false
    trailE.player = playerId

    trailE.asset.scale.set(speed / speedMultiplier / 2)

    l1.addBehavior(
      activate(),
      trailE,
    )
  },
})

/*
 * This behavior is needed so that the player wont immediately collide with its own tail.
 */
const activate = () => ({
  endTime:    15,
  onComplete: ({ entity }) => {
    entity.active = true
  },
})

const holeMaker = (speed, speedMultiplier) => ({
  id:      'holeMaker',
  endTime: l1.getRandomInRange(
    Math.ceil(HOLE_LENGTH_MIN_TIME * (speedMultiplier / speed)),
    Math.ceil(HOLE_LENGTH_MAX_TIME * (speedMultiplier / speed)),
  ),
  onInit: ({ entity }) => {
    entity.preventTrail = true
  },
  onRemove: ({ entity }) => {
    entity.preventTrail = false
    l1.addBehavior(
      createHoleMaker(speed, speedMultiplier),
      entity,
    )
  },
})

export const createHoleMaker = (speed, speedMultiplier) => ({
  id:      'createHoleMaker',
  endTime: l1.getRandomInRange(
    GENERATE_HOLE_MIN_TIME,
    GENERATE_HOLE_MAX_TIME,
  ),
  onRemove: ({ entity }) => {
    l1.addBehavior(
      holeMaker(speed, speedMultiplier),
      entity,
    )
  },
})

export const collisionCheckerTrail = (playerId, speedMultiplier) => ({
  endTime:    2,
  loop:       true,
  onComplete: ({ entity }) => {
    const allTrails = l1
      .getByType('trail')
      .filter(t => t.active || t.player !== playerId)

    if (allTrails.some(t => l1.isColliding(t, entity))) {
      killPlayer(entity, speedMultiplier)
      checkPlayersAlive()
    }
  },
})

const killPlayer = (entity, speedMultiplier) => {
  l1.particles({
    ...explode({
      degrees:     entity.degrees,
      scaleFactor: speedMultiplier / entity.speed,
      radius:      entity.width,
      x:           l1.getX(entity),
      y:           l1.getY(entity),
    }),
    zIndex: Layer.FOREGROUND + 1,
    parent: entity,
  })

  l1.sound({
    src:    './sounds/explosion.wav',
    volume: 0.6,
    parent: entity,
  })

  entity.killed = true

  R.pipe(
    l1.removeBehavior('collisionCheckerTrail'),
    l1.removeBehavior('collisionCheckerWalls'),
    l1.removeBehavior('createHoleMaker'),
    l1.removeBehavior('createTrail'),
    l1.removeBehavior('move'),
    l1.removeBehavior('pivot'),
  )(entity)

  gameState.events.emit(GameEvent.PLAYER_COLLISION, entity.color)
  entity.event.emit(GameEvent.PLAYER_COLLISION)
}

export const collisionCheckerWalls = ({
  speedMultiplier, wallThickness,
}) => ({
  endTime:    2,
  loop:       true,
  onComplete: ({ entity }) => {
    if (
      l1.getX(entity) < wallThickness ||
      l1.getX(entity) > GAME_WIDTH - wallThickness - entity.width ||
      l1.getY(entity) < wallThickness ||
      l1.getY(entity) > GAME_HEIGHT - wallThickness - entity.height) {
      killPlayer(entity, speedMultiplier)
      checkPlayersAlive()
    }
  },
})

const checkPlayersAlive = () => {
  const playersAlive = l1
    .getByType('player')
    .filter(p => !p.killed)

  if (playersAlive.length === 1 && gameState.currentState === CurrentState.PLAYING_ROUND) {
    gameState.lastRoundResult.winner = playersAlive[0].color
    gameState.lastRoundResult.playerFinishOrder =
            gameState.lastRoundResult.playerFinishOrder.concat([playersAlive[0].id])

    transitionToRoundEnd()
  }
}
