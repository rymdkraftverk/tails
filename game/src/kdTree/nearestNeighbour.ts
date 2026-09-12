import { calculateMiddle, type GetCoord, type Tree } from './common'

type Options<T> = {
  earlyReturn: (candidate: T) => boolean
  filter:      (candidate: T) => boolean
  getCoord:    GetCoord<T>
}

const calculateDistance = <T>(
  getCoord: GetCoord<T>,
  dimensions: string[],
  e1: T,
  e2: T,
) => Math.sqrt(dimensions
  .map(dim => (getCoord(e1, dim) - getCoord(e2, dim)) ** 2)
  .reduce((a, b) => a + b, 0))

const nearestNeighbour = <T>(
  options: Options<T>,
  tree: Tree<T>,
  entity: T,
): T | null => {
  // leaf
  if (tree.value) {
    return options.filter(tree.value)
      ? tree.value
      : null
  }

  // empty tree
  if (!tree.true && !tree.false) {
    return null
  }

  const middle = calculateMiddle(tree.borders, tree.dimension)
  const entityCoord = options.getCoord(entity, tree.dimension)
  const surpassesMiddle = entityCoord > middle

  const nearerSide = (surpassesMiddle ? tree.true : tree.false) as Tree<T>
  const fartherSide = (surpassesMiddle ? tree.false : tree.true) as Tree<T>

  const candidate = nearestNeighbour(options, nearerSide, entity)

  if (!candidate) {
    return nearestNeighbour(options, fartherSide, entity)
  }

  if (options.earlyReturn(candidate)) {
    return candidate
  }

  const { getCoord } = options
  const dimensions = Object.keys(tree.borders)
  const candidateDistance = calculateDistance(getCoord, dimensions, entity, candidate)

  const middleDistance = Math.abs(entityCoord - middle)

  if (candidateDistance < middleDistance) {
    return candidate
  }

  const otherCandidate = nearestNeighbour(options, fartherSide, entity)

  if (otherCandidate === null) {
    return candidate
  }

  const otherCandidateDistance = calculateDistance(getCoord, dimensions, entity, otherCandidate)

  return candidateDistance < otherCandidateDistance
    ? candidate
    : otherCandidate
}

const nearestNeighbourExport = <T>(
  { getCoord, earlyReturn, filter }: Partial<Options<T>>,
  tree: Tree<T>,
  entity: T,
) => nearestNeighbour(
  {
    getCoord:    getCoord || ((e, d) => (e as Record<string, number>)[d]),
    earlyReturn: earlyReturn || (() => false),
    filter:      filter || (() => true),
  },
  tree,
  entity,
)

export { nearestNeighbourExport as nearestNeighbour }
