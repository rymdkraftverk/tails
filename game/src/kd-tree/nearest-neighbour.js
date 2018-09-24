import { add, always, isNil } from 'ramda'
import { dimensions, calculateLimit } from './common'

const calculateDistance = (e1, e2) =>
  Math.sqrt(dimensions
    .map(dim => e1[dim] - e2[dim])
    .map(distance => distance * distance)
    .reduce(add, 0))

const nearestNeighbour = (tree, entity, filter = always(true)) => {
  if (isNil(tree)) {
    return null
  }

  if (tree.value) {
    return filter(tree.value)
      ? tree.value
      : null
  }

  if (!tree.true && !tree.false) {
    return null
  }

  const nodeDivider = calculateLimit(tree.borders, tree.dimension)
  const surpassesLimit = entity[tree.dimension] > nodeDivider

  const candidate = nearestNeighbour(tree[surpassesLimit], entity, filter)

  if (candidate === null) {
    return nearestNeighbour(tree[!surpassesLimit], entity, filter)
  }

  const candidateDistance = calculateDistance(entity, candidate)

  const dividerDistance = Math.abs(entity[tree.dimension] - nodeDivider)

  if (candidateDistance < dividerDistance) {
    return candidate
  }

  const otherCandidate = nearestNeighbour(tree[!surpassesLimit], entity, filter)

  if (otherCandidate === null) {
    return candidate
  }

  const otherCandidateDistance = calculateDistance(entity, otherCandidate)

  return candidateDistance < otherCandidateDistance
    ? candidate
    : otherCandidate
}

export default nearestNeighbour
