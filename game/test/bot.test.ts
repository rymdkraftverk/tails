import {
  addObstacles,
  choose,
  field,
  isBlocked,
  openness,
  simulate,
} from '../src/bot/space'

const bounds = {
  left: 0, top: 0, right: 400, bottom: 400,
}

const empty = field(bounds)

test('a box past the walls is blocked', () => {
  expect(isBlocked(empty, { x: 200, y: 200, half: 5 }))
    .toBe(false)
  expect(isBlocked(empty, { x: 398, y: 200, half: 5 }))
    .toBe(true)
})

test('a box touching a trail is blocked', () => {
  const space = addObstacles(field(bounds), [{ x: 100, y: 100, half: 4 }])

  expect(isBlocked(space, { x: 108, y: 100, half: 5 }))
    .toBe(true)
  expect(isBlocked(space, { x: 120, y: 100, half: 5 }))
    .toBe(false)
})

test('going straight covers speed per tick', () => {
  const path = simulate(
    {
      x: 0, y: 0, degrees: 0, speed: 2,
    },
    { first: 0, switchAt: 30, then: 0 },
    30,
  )

  expect(path[path.length - 1].x)
    .toBeCloseTo(60)
  expect(path[path.length - 1].y)
    .toBeCloseTo(0)
})

test('an enclosed pocket is less open than the middle of the field', () => {
  const wall = Array.from({ length: 40 }, (_, index) => ({ x: 60, y: index * 4, half: 4 }))
  const pocket = addObstacles(field(bounds), [
    ...wall,
    ...wall.map(({ y }) => ({ x: y, y: 60, half: 4 })),
  ])

  expect(openness(pocket, { x: 30, y: 30 }))
    .toBeLessThan(openness(pocket, { x: 250, y: 250 }))
})

test('a bot heading into a wall turns away from it', () => {
  const turn = choose({
    space: empty,
    self:  {
      x: 350, y: 200, degrees: 0, speed: 2,
    },
    half:    5,
    horizon: 60,
    rivals:  [],
    goals:   [],
    hazards: [],
    current: 0,
  })

  expect(turn).not.toBe(0)
})

test('a bot steers for a reachable powerup', () => {
  const turn = choose({
    space: empty,
    self:  {
      x: 200, y: 200, degrees: 0, speed: 2,
    },
    half:    5,
    horizon: 60,
    rivals:  [],
    goals:   [{ x: 236, y: 238, half: 6 }],
    hazards: [],
    current: 0,
  })

  expect(turn)
    .toBeGreaterThan(0)
})
