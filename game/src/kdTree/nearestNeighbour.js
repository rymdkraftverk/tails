import * as R from 'ramda'
import { calculateMiddle } from './common'

const calculateDistance = (getCoord, dimensions, e1, e2) => Math.sqrt(dimensions
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
  const nearerSide = String(surpassesMiddle)
  const fartherSide = String(!surpassesMiddle)

  const candidate = nearestNeighbour(options, tree[nearerSide], entity)

  if (!candidate) {
    return nearestNeighbour(options, tree[fartherSide], entity)
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

  const otherCandidate = nearestNeighbour(options, tree[fartherSide], entity)

  if (otherCandidate === null) {
    return candidate
  }

  const otherCandidateDistance = calculateDistance(getCoord, dimensions, entity, otherCandidate)

  return candidateDistance < otherCandidateDistance
    ? candidate
    : otherCandidate
}

const nearestNeighbourExport = R.curry(({ getCoord, earlyReturn, filter }, tree, entity) => {
  const options = {
    getCoord:    getCoord || ((e, d) => e[d]),
    earlyReturn: earlyReturn || (R.F),
    filter:      filter || (R.T),
  }

  return nearestNeighbour(options, tree, entity)
})

export { nearestNeighbourExport as nearestNeighbour }
