import { calculateMiddle } from './common'
import DIMENSIONS from './dimensions'

const calculateDistance = (getCoord, e1, e2) =>
  Math.sqrt(DIMENSIONS
    .map(dim => (getCoord(e1, dim) - getCoord(e2, dim)) ** 2)
    .reduce((a, b) => a + b, 0))

export const nearestNeighbour = (options, tree, entity) => {
  // empty branch
  if (!tree) {
    return null
  }

  // leaf
  if (tree.value) {
    const filter = options.filter || (() => true)

    return filter(tree.value)
      ? tree.value
      : null
  }

  // empty tree
  if (!tree.true && !tree.false) {
    return null
  }

  const limit = calculateMiddle(tree.borders, tree.dimension)
  const surpassesMiddle = entity[tree.dimension] > limit

  const candidate = nearestNeighbour(options, tree[surpassesMiddle], entity)

  if (!candidate) {
    return nearestNeighbour(options, tree[!surpassesMiddle], entity)
  }

  const earlyReturn = options.earlyReturn || (() => false)
  if (earlyReturn(candidate)) {
    return candidate
  }

  const getCoord = options.getCoord || ((e, d) => e[d])
  const candidateDistance = calculateDistance(getCoord, entity, candidate)

  const limitDistance = Math.abs(entity[tree.dimension] - limit)

  if (candidateDistance < limitDistance) {
    return candidate
  }

  const otherCandidate = nearestNeighbour(options, tree[!surpassesMiddle], entity)

  if (otherCandidate === null) {
    return candidate
  }

  const otherCandidateDistance = calculateDistance(getCoord, entity, otherCandidate)

  return candidateDistance < otherCandidateDistance
    ? candidate
    : otherCandidate
}
