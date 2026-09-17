import * as l2 from 'l2'
import type { Behavior } from 'l2'
import type * as PIXI from 'pixi.js'

import { GAME_WIDTH, GAME_HEIGHT, WALL_THICKNESS } from '../constant/rendering'
import { HEADER_HEIGHT } from '../header'
import Scene from '../Scene'
import {
  addObstacles,
  choose,
  field,
  type Box,
  type Field,
  type Mover,
  type Obstacle,
} from './space'

const THINK_INTERVAL = 6
const LOOKAHEAD = 150
const HORIZON = { min: 45, max: 120 }
const OWN_TRAIL_GRACE = 30
const SAFETY = 2

const half = (displayObject: PIXI.Container) => (displayObject.hitArea as PIXI.Rectangle).width / 2

const mover = (player: PIXI.Container): Mover => ({
  x:       player.x + half(player),
  y:       player.y + half(player),
  degrees: player.degrees,
  speed:   player.speed,
})

const isGhost = (player: PIXI.Container) => l2.getBehavior(`ghost-${player.id}`) !== undefined

const trail = (owner: PIXI.Container) => (displayObject: PIXI.Container): Obstacle => ({
  x:      displayObject.x + half(displayObject),
  y:      displayObject.y + half(displayObject),
  half:   half(displayObject),
  owner:  owner.id,
  laidAt: displayObject.counter,
})

const centered = (displayObject: PIXI.Container): Box => ({
  x:    displayObject.x,
  y:    displayObject.y,
  half: displayObject.width / 2,
})

const cached = {
  scene:     undefined as PIXI.Container | undefined,
  space:     undefined as Field | undefined,
  players:   [] as PIXI.Container[],
  generator: undefined as PIXI.Container | undefined,
  counted:   new Map<string, number>(),
}

const world = () => {
  const scene = l2.get(Scene.GAME)

  if (cached.scene !== scene || !cached.space) {
    cached.scene = scene
    cached.players = l2.getByLabel('player')
    cached.generator = undefined
    cached.counted = new Map()
    cached.space = field({
      left:   WALL_THICKNESS,
      top:    HEADER_HEIGHT + WALL_THICKNESS,
      right:  GAME_WIDTH - WALL_THICKNESS,
      bottom: GAME_HEIGHT - WALL_THICKNESS,
    })
  }

  if (!cached.generator) {
    [cached.generator] = l2.getByLabel('powerupGenerator')
  }

  const { space, players, generator } = cached

  players
    .filter(player => player.trailContainer)
    .forEach((player) => {
      const { children } = player.trailContainer
      const counted = cached.counted.get(player.id) ?? 0
      addObstacles(space, children
        .slice(counted)
        .map(trail(player)))
      cached.counted.set(player.id, children.length)
    })

  const pickups = (label: string) => (generator?.children ?? [])
    .filter(child => l2
      .getLabels(child)
      .includes(label))
    .map(centered)

  return {
    space,
    players,
    goals:   pickups('powerup'),
    hazards: pickups('portal'),
  }
}

const decide = (self: PIXI.Container) => {
  const {
    space, players, goals, hazards,
  } = world()
  const ghost = isGhost(self)
  const now = self.trailContainer.counter

  return choose({
    space,
    self:    mover(self),
    half:    half(self) + SAFETY,
    horizon: Math.min(HORIZON.max, Math.max(HORIZON.min, Math.round(LOOKAHEAD / self.speed))),
    rivals:  players
      .filter(player => player !== self && player.alive)
      .map(mover),
    goals,
    hazards,
    current: self.turnRate,
    ignore:  ({ owner, laidAt }) => (ghost && owner !== undefined)
      || (owner === self.id && now - (laidAt ?? 0) < OWN_TRAIL_GRACE),
  })
}

export default (player: PIXI.Container) => {
  const offset = l2.getRandomInRange(0, THINK_INTERVAL)

  return {
    id:       `bot-${player.id}`,
    onUpdate: ({ counter }: Behavior) => {
      if ((counter + offset) % THINK_INTERVAL !== 0) return
      if (player.alive && player.trailContainer) player.turnRate = decide(player)
    },
  }
}
