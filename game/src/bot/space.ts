export type Point = { x: number, y: number }

export type Box = Point & { half: number }

export type Obstacle = Box & { owner?: string, laidAt?: number }

export type Mover = Point & { degrees: number, speed: number }

export type Bounds = { left: number, top: number, right: number, bottom: number }

export type Plan = { first: number, switchAt: number, then: number }

export type Field = {
  bounds:  Bounds
  cells:   Map<number, Obstacle[]>
  lattice: Set<number>
}

type Ignore = (obstacle: Obstacle) => boolean

const CELL = 24
const MAX_TURN = 3
const SAMPLE_EVERY = 3
const FLOOD_STEP = 24
const FLOOD_BUDGET = 200
const SURVIVAL_BUCKET = 4
const THREAT_PENALTY = FLOOD_BUDGET / 4
const GOAL_BONUS = FLOOD_BUDGET / 4
const STEADY_BONUS = 3
const TURNS = [-MAX_TURN, -MAX_TURN / 2, 0, MAX_TURN / 2, MAX_TURN]
const SWITCHES = [6, 24]
const FINISHES = [-MAX_TURN, 0, MAX_TURN]

const keepAll: Ignore = () => false

const cellOf = (value: number) => Math.floor(value / CELL)

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))

const between = (from: number, to: number) => Array
  .from({ length: Math.max(0, to - from + 1) }, (_, index) => from + index)

const LATTICE_COLUMNS = 1000

const cellsUnder = ({ x, y, half }: Box) => {
  const fromColumn = cellOf(x - half)
  const toColumn = cellOf(x + half)
  const fromRow = cellOf(y - half)
  const toRow = cellOf(y + half)

  if (fromColumn === toColumn && fromRow === toRow) {
    return [(fromRow * LATTICE_COLUMNS) + fromColumn]
  }

  const columns = between(fromColumn, toColumn)
  return between(fromRow, toRow)
    .flatMap(row => columns.map(column => (row * LATTICE_COLUMNS) + column))
}

const latticeIndex = (column: number, row: number) => (row * LATTICE_COLUMNS) + column

const latticeOf = (value: number) => Math.round(value / FLOOD_STEP)

export const field = (bounds: Bounds): Field => ({
  bounds,
  cells:   new Map(),
  lattice: new Set(),
})

export const addObstacles = (space: Field, obstacles: Obstacle[]) => {
  const halfStep = FLOOD_STEP / 2

  obstacles.forEach((obstacle) => {
    cellsUnder(obstacle)
.forEach((index) => {
      const cell = space.cells.get(index)
      if (cell) cell.push(obstacle)
      else space.cells.set(index, [obstacle])
    })

    const columns = between(
      Math.ceil((obstacle.x - obstacle.half - halfStep) / FLOOD_STEP),
      Math.floor((obstacle.x + obstacle.half + halfStep) / FLOOD_STEP),
    )

    between(
      Math.ceil((obstacle.y - obstacle.half - halfStep) / FLOOD_STEP),
      Math.floor((obstacle.y + obstacle.half + halfStep) / FLOOD_STEP),
    )
      .forEach(row => columns
        .forEach(column => space.lattice.add(latticeIndex(column, row))))
  })

  return space
}

export const isBlocked = (
  { bounds, cells }: Field,
  box: Box,
  ignore: Ignore = keepAll,
) => {
  const { x, y, half } = box
  if (
    x - half < bounds.left
    || x + half > bounds.right
    || y - half < bounds.top
    || y + half > bounds.bottom
  ) return true

  return cellsUnder(box)
    .some(index => (cells.get(index) ?? [])
      .some(obstacle => Math.abs(obstacle.x - x) <= obstacle.half + half
        && Math.abs(obstacle.y - y) <= obstacle.half + half
        && !ignore(obstacle)))
}

const overlapsAny = (boxes: Box[], { x, y, half }: Box) => boxes
  .some(box => Math.abs(box.x - x) <= box.half + half && Math.abs(box.y - y) <= box.half + half)

export const turnAt = ({ first, switchAt, then }: Plan, tick: number) => (
  tick < switchAt ? first : then
)

export const plans = (horizon: number): Plan[] => TURNS.flatMap(first => [
  { first, switchAt: horizon, then: first },
  ...SWITCHES.flatMap(switchAt => FINISHES.map(then => ({ first, switchAt, then }))),
])

export const simulate = (start: Mover, plan: Plan, ticks: number) => Array
  .from({ length: ticks }, (_, tick) => tick)
  .reduce(
    (walk, tick) => {
      walk.degrees = (walk.degrees + clamp(turnAt(plan, tick), -MAX_TURN, MAX_TURN)) % 360
      const radians = walk.degrees * (Math.PI / 180)
      walk.x += Math.cos(radians) * start.speed
      walk.y += Math.sin(radians) * start.speed
      if ((tick + 1) % SAMPLE_EVERY === 0) {
        walk.path.push({ x: walk.x, y: walk.y, tick: tick + 1 })
      }
      return walk
    },
    {
      x: start.x, y: start.y, degrees: start.degrees, path: [] as (Point & { tick: number })[],
    },
  )
  .path

export const straightAhead = (mover: Mover, tick: number) => {
  const radians = mover.degrees * (Math.PI / 180)
  return {
    x: mover.x + (Math.cos(radians) * mover.speed * tick),
    y: mover.y + (Math.sin(radians) * mover.speed * tick),
  }
}

const threats = (bounds: Bounds, rivals: Mover[], horizon: number, half: number) => addObstacles(
  field(bounds),
  rivals.flatMap(rival => between(0, Math.floor(horizon / SAMPLE_EVERY))
    .map(index => ({
      ...straightAhead(rival, index * SAMPLE_EVERY),
      half,
      laidAt: index * SAMPLE_EVERY,
    }))),
)

export const openness = ({ bounds, lattice }: Field, from: Point) => {
  const halfStep = FLOOD_STEP / 2
  const blocked = (column: number, row: number) => lattice.has(latticeIndex(column, row))
    || (column * FLOOD_STEP) - halfStep < bounds.left
    || (column * FLOOD_STEP) + halfStep > bounds.right
    || (row * FLOOD_STEP) - halfStep < bounds.top
    || (row * FLOOD_STEP) + halfStep > bounds.bottom

  const start = { column: latticeOf(from.x), row: latticeOf(from.y) }

  if (blocked(start.column, start.row)) return 0

  const seen = new Set([latticeIndex(start.column, start.row)])
  const queue = [start]

  const visit = (index: number) => {
    if (index >= queue.length || queue.length >= FLOOD_BUDGET) return
    const { column, row } = queue[index]
    const neighbours = [
      { column: column + 1, row },
      { column: column - 1, row },
      { column, row: row + 1 },
      { column, row: row - 1 },
    ]
    neighbours
      .filter(next => !seen.has(latticeIndex(next.column, next.row))
        && !blocked(next.column, next.row))
      .forEach((next) => {
        seen.add(latticeIndex(next.column, next.row))
        queue.push(next)
      })
  }

  between(0, FLOOD_BUDGET - 1)
    .forEach(visit)

  return Math.min(queue.length, FLOOD_BUDGET)
}

export const choose = ({
  space, self, half, horizon, rivals, goals, hazards, current, ignore = keepAll,
}: {
  space:   Field
  self:    Mover
  half:    number
  horizon: number
  rivals:  Mover[]
  goals:   Box[]
  hazards: Box[]
  current: number
  ignore?: Ignore
}) => {
  const rivalPaths = threats(space.bounds, rivals, horizon, half)
  const cache = new Map<number, number>()
  const cachedOpenness = (point: Point) => {
    const key = latticeIndex(latticeOf(point.x), latticeOf(point.y))
    if (!cache.has(key)) cache.set(key, openness(space, point))
    return cache.get(key) as number
  }

  const rate = (plan: Plan) => {
    const path = simulate(self, plan, horizon)
    const crash = path.findIndex(point => isBlocked(space, { ...point, half }, ignore)
      || overlapsAny(hazards, { ...point, half }))
    const survived = crash === -1 ? path : path.slice(0, crash)
    const end = survived[survived.length - 1] ?? self
    const threatened = () => survived
      .some(point => isBlocked(
        rivalPaths,
        { ...point, half },
        ({ laidAt }) => (laidAt ?? 0) >= point.tick,
      ))
    const reachesGoal = survived.some(point => overlapsAny(goals, { ...point, half }))

    return {
      plan,
      survival: Math.floor(survived.length / SURVIVAL_BUCKET),
      value:    () => cachedOpenness(end)
        - (threatened() ? THREAT_PENALTY : 0)
        + (reachesGoal ? GOAL_BONUS : 0)
        + (plan.first === current ? STEADY_BONUS : 0)
        + (plan.first === 0 ? STEADY_BONUS : 0),
    }
  }

  const rated = plans(horizon)
    .map(rate)
  const longest = Math.max(...rated.map(({ survival }) => survival))

  const [best] = rated
    .filter(({ survival }) => survival === longest)
    .map(({ plan, value }) => ({ plan, value: value() }))
    .sort((a, b) => b.value - a.value)

  return best.plan.first
}
