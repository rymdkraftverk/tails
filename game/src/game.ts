import * as l2 from 'l2'
import type { Behavior } from 'l2'
import * as PIXI from 'pixi.js'
import EventEmitter from 'eventemitter3'
import { Event, Channel } from 'common'
import { initEmptyTree } from './kdTree'
import { range, shuffle } from './util'
import { GAME_WIDTH, GAME_HEIGHT, WALL_THICKNESS } from './constant/rendering'
import { State, state } from './state'
import playerRepository from './repository/player'
import { transitionToRoundEnd } from './roundEnd'
import Layer from './constant/layer'
import countdown from './countdown'
import bounce from './bounce'
import Scene from './Scene'
import { animateScoreGainOnLivingPlayers, giveLivingPlayersOnePoint } from './scoreGain'
import { initPowerups } from './powerup'
import { playTrack } from 'l2/sound'
import { Track } from './constant/sound'
import { collisionCheckerWalls, collisionCheckerTrail } from './collisionDetection'
import { createTrail, createHoleMaker } from './trail'
import GameEvent from './constant/gameEvent'
import createHeader, { HEADER_HEIGHT } from './header'
import getControllerUrl from './getControllerUrl'
import * as bot from './bot'

window.debug = {
  ...window.debug,
  transitionToRoundEnd,
}

const { warn } = console

export const TURN_RADIUS = 3
export const SPEED_MULTIPLIER = 3.6

const PLAYER_HITBOX_SIZE = 14

const TOTAL_BOUNCE_DURATION = 50

state
  .eventEmitter
  .on(GameEvent.PLAYER_COLLISION, animateScoreGainOnLivingPlayers)

state
  .eventEmitter
  .on(GameEvent.PLAYER_COLLISION, giveLivingPlayersOnePoint)

export const GameColor = {
  BLUE:  0x0B4D6C,
  WHITE: 0xeeeeee,
}

export const transitionToGameScene = (maxPlayers: number) => {
  state.state = State.PLAYING_ROUND
  state.kdTree = initEmptyTree({
    x: {
      min: 0,
      max: GAME_WIDTH,
    },
    y: {
      min: 0,
      max: GAME_HEIGHT,
    },
  })

  state.portalPairs = 0

  // The header is persistent across game and score
  createHeader({
    url:  getControllerUrl(),
    code: state.gameCode,
  })

  const gameScene = new PIXI.Container()
  l2.add(gameScene, {
    id: Scene.GAME,
  })

  const playerCountFactor = playerRepository.countFactor()

  const startingPositions = shuffle(
    Array.from({ length: maxPlayers }, (_unused, index) => index),
  )

  const bots = state.players.map(player => player.bot)

  const players = state
    .players
    .map((player, index) => createPlayer(playerCountFactor, startingPositions[index], player))

  createWalls()

  bouncePlayers(players, playerCountFactor)
    .then(countdown)
    .then(() => {
      players.forEach((player, index) => {
        const kind = bots[index]

        const behaviorsToAdd = [
          pivot(player),
          createHoleMaker(player, player.scaleFactor, SPEED_MULTIPLIER),
          createTrail({
            player,
            scale:           player.scaleFactor,
            speedMultiplier: SPEED_MULTIPLIER,
          }),
          move(player),
          collisionCheckerTrail(player, SPEED_MULTIPLIER),
          collisionCheckerWalls({
            player,
            speedMultiplier: SPEED_MULTIPLIER,
            wallThickness:   WALL_THICKNESS,
          }),
          kind ? bot.behavior(player, kind) : null,
        ]

        behaviorsToAdd
          .filter(behavior => behavior !== null)
          .forEach(behavior => l2.addBehavior(behavior))

        l2.destroy(`${player.id}:direction`)
      })
      initPowerups({
        snakeSpeed:      l2.getByLabel('player')[0].speed,
        speedMultiplier: SPEED_MULTIPLIER,
        gameWidth:       GAME_WIDTH,
        gameHeight:      GAME_HEIGHT + HEADER_HEIGHT,
      })
    })

  playTrack(Track.GAME)
}

const getStartingPosition = (index: number) => {
  const maxYRadius = (GAME_HEIGHT - HEADER_HEIGHT) / 2 / (1 + Math.sqrt(3))
  const maxXRadius = GAME_WIDTH / 8

  const topRow = range(1, 4)
    .map(i => ({
      x: i * 2 * maxXRadius,
      y: maxYRadius + HEADER_HEIGHT,
    }))

  const middleRow = range(0, 4)
    .map(i => ({
      x: maxXRadius * (1 + (2 * i)),
      y: (maxYRadius * (1 + Math.sqrt(3))) + HEADER_HEIGHT,
    }))

  const bottomRow = range(1, 4)
    .map(i => ({
      x: i * 2 * maxXRadius,
      y: (maxYRadius * (1 + (2 * Math.sqrt(3)))) + HEADER_HEIGHT,
    }))

  const positions = bottomRow
    .concat(middleRow)
    .concat(topRow)

  return positions[index]
}

const createPlayer = (playerCountFactor: number, index: number, { id, color }: Player) => {
  const { x, y } = getStartingPosition(index)

  const snakeSpeed = SPEED_MULTIPLIER / playerCountFactor

  const player = new PIXI.Container()
  l2.add(
    player,
    {
      id,
      parent: l2.get(Scene.GAME),
      labels: ['player'],
      zIndex: Layer.FOREGROUND,
    },
  )
  const sprite = new PIXI.Sprite(l2.getTexture(`circle/circle-${color}`))
  l2.add(sprite, { parent: player })
  player.sprite = sprite
  player.boundsArea = new PIXI.Rectangle(0, 0, sprite.width, sprite.height)
  if (playerRepository.isFirstPlace(id)) {
    const crown = new PIXI.Sprite(l2.getTexture('crown'))
    l2.add(crown, {
      parent: player,
    })
    crown.scale.set(2)
    crown.x -= crown.width / 4
    crown.y -= crown.height
  }

  player.x = x
  player.y = y
  player.visible = false

  player.speed = snakeSpeed
  player.degrees = l2.getRandomInRange(0, 360)
  player.turnRate = 0
  player.event = new EventEmitter()
  player.color = color
  player.alive = true
  player.id = id
  player.preventTrail = 0
  player.fatLevel = 1

  player.event.on(GameEvent.PLAYER_COLLISION, () => {
    const p = playerRepository.find(id)

    if (!p) {
      warn(`Player with id: ${id} not found`)
      return
    }

    p.send(Channel.RELIABLE, {
      event:   Event.PLAYER_DIED,
      payload: {},
    })
  })

  player.scaleFactor = player.speed

  setPlayerSize(player, player.fatLevel)

  return player
}

export const setPlayerSize = (player: PIXI.Container, sizeMultiplier: number) => {
  player.scaleFactor = player.speed

  player.scale.set((player.scaleFactor / SPEED_MULTIPLIER / 2) * sizeMultiplier)

  const playerSize = PLAYER_HITBOX_SIZE * (player.speed / SPEED_MULTIPLIER) * sizeMultiplier

  player.hitArea = new PIXI.Rectangle(
    0,
    0,
    playerSize,
    playerSize,
  )
  // Offset the sprite so that the player hitbox is in the middle
  player.sprite.anchor.set((1 - (playerSize / player.width)) / 2)
}

const bouncePlayers = (
  players: PIXI.Container[],
  playerCountFactor: number,
) => new Promise<void>((resolve) => {
  const bouncer = new PIXI.Container()
  l2.add(bouncer, {
    id: 'bouncer',
  })

  const bouncePlayerBehavior = () => ({
    id:       'bouncePlayers',
    duration: Math.floor(TOTAL_BOUNCE_DURATION / players.length) + 15,
    data:     {
      index: 0,
    },
    loop:       true,
    onComplete: ({ data }: Behavior<{ index: number }>) => {
      const player = players[data.index]
      player.visible = true

      l2.addBehavior(bounce(player, 0.03))

      data.index += 1

      const directionRadians = toRadians(player.degrees)
      const directionDistanceScale = 200 / playerCountFactor

      const directionIndicator = new PIXI.Sprite(l2.getTexture(`arrow/arrow-${player.color}`))
      l2.add(
        directionIndicator,
        {
          id:     `${player.id}:direction`,
          parent: player,
        },
      )

      directionIndicator.color = player.color

      directionIndicator.x = (directionDistanceScale * Math.cos(directionRadians))
        + (player.width * 2)
      directionIndicator.y = (directionDistanceScale * Math.sin(directionRadians))
        + (player.height * 2)
      directionIndicator.scale.set((3 * player.scaleFactor) / SPEED_MULTIPLIER)
      directionIndicator.anchor.set(0.5)
      directionIndicator.rotation = toRadians(player.degrees)

      if (data.index === players.length) {
        l2.destroy(bouncer)
        l2.removeBehavior('bouncePlayers')
        resolve()
      }
    },
  })

  l2.addBehavior(bouncePlayerBehavior())
})

export const toRadians = (angle: number) => angle * (Math.PI / 180)

const move = (player: PIXI.Container) => ({
  id:       `move-${player.id}`,
  onUpdate: () => {
    const radians = toRadians(player.degrees)
    player.x += Math.cos(radians) * player.speed
    player.y += Math.sin(radians) * player.speed
  },
})

const pivot = (player: PIXI.Container) => ({
  id:       `pivot-${player.id}`,
  onUpdate: () => {
    const throttledTurnRate = Math.min(TURN_RADIUS, Math.max(-TURN_RADIUS, player.turnRate))

    player.degrees = (player.degrees + throttledTurnRate) % 360
  },
})

const createWalls = () => {
  const walls = new PIXI.Graphics()
  l2.add(
    walls,
    {
      id:     'walls',
      parent: l2.get(Scene.GAME),
      zIndex: Layer.FOREGROUND + 1,
    },
  )
  const halfWallThickness = WALL_THICKNESS / 2

  const y = HEADER_HEIGHT + halfWallThickness

  walls
    .moveTo(halfWallThickness, y)
    .lineTo(GAME_WIDTH - halfWallThickness, y)
    .lineTo(GAME_WIDTH - halfWallThickness, GAME_HEIGHT)
    .lineTo(halfWallThickness, GAME_HEIGHT)
    .lineTo(halfWallThickness, y)
    .stroke({ color: GameColor.WHITE, width: WALL_THICKNESS })

  walls.cacheAsTexture(true)
}
