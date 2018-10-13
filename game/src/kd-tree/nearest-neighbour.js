import R from 'ramda'
import { calculateMiddle } from './common'
import DIMENSIONS from './dimensions'

const calculateDistance = (getCoord, e1, e2) =>
  Math.sqrt(DIMENSIONS
    .map(dim => (getCoord(e1, dim) - getCoord(e2, dim)) ** 2)
    .reduce((a, b) => a + b, 0))

const nearestNeighbour = (options, tree, entity) => {
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

  const limitDistance = Math.abs(entityCoord - middle)

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

const nearestNeighbourExport = R.curry(({ getCoord, earlyReturn, filter }, tree, entity) => {
  const options = {
    getCoord:    getCoord || ((e, d) => e[d]),
    earlyReturn: earlyReturn || (() => false),
    filter:      filter || (() => true),
  }

  return nearestNeighbour(options, tree, entity)
})

export { nearestNeighbourExport as nearestNeighbour }
