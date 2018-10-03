import { add, always, isNil } from 'ramda'
import { dimensions, calculateLimit } from './common'

const calculateDistance = (e1, e2) =>
  Math.sqrt(dimensions
    .map(dim => e1[dim] - e2[dim])
    .map(distance => distance * distance)
    .reduce(add, 0))

export const nearestNeighbour = (
  tree,
  entity,
  earlyReturn = always(false),
  filter = always(true),
) => {
  // empty branch
  if (isNil(tree)) {
    return null
  }

  // leaf
  if (tree.value) {
    return filter(tree.value)
      ? tree.value
      : null
  }

  // empty tree
  if (!tree.true && !tree.false) {
    return null
  }

  const limit = calculateLimit(tree.borders, tree.dimension)
  const surpassesLimit = entity[tree.dimension] > limit

  const candidate = nearestNeighbour(tree[surpassesLimit], entity, earlyReturn, filter)

  if (isNil(candidate)) {
    return nearestNeighbour(tree[!surpassesLimit], entity, earlyReturn, filter)
  }

  if (earlyReturn(candidate)) {
    return candidate
  }

  const candidateDistance = calculateDistance(entity, candidate)

  const limitDistance = Math.abs(entity[tree.dimension] - limit)

  if (candidateDistance < limitDistance) {
    return candidate
  }

  const otherCandidate = nearestNeighbour(tree[!surpassesLimit], entity, earlyReturn, filter)

  if (otherCandidate === null) {
    return candidate
  }

  const otherCandidateDistance = calculateDistance(entity, otherCandidate)

  return candidateDistance < otherCandidateDistance
    ? candidate
    : otherCandidate
}
