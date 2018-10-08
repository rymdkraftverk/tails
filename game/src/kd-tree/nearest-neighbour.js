import { dimensions, calculateLimit } from './common'

const calculateDistance = (e1, e2) =>
  Math.sqrt(dimensions
    .map(dim => Math.pow(e1[dim] - e2[dim], 2))
    .reduce((a,b) => a + b, 0))

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

  const limit = calculateLimit(tree.borders, tree.dimension)
  const surpassesLimit = entity[tree.dimension] > limit

  const candidate = nearestNeighbour(options, tree[surpassesLimit], entity)

  if (!candidate) {
    return nearestNeighbour(options, tree[!surpassesLimit], entity)
  }

  const earlyReturn = options.earlyReturn || R.always(false)
  if (earlyReturn(candidate)) {
    return candidate
  }

  const candidateDistance = calculateDistance(entity, candidate)

  const limitDistance = Math.abs(entity[tree.dimension] - limit)

  if (candidateDistance < limitDistance) {
    return candidate
  }

  const otherCandidate = nearestNeighbour(options, tree[!surpassesLimit], entity)

  if (otherCandidate === null) {
    return candidate
  }

  const otherCandidateDistance = calculateDistance(entity, otherCandidate)

  return candidateDistance < otherCandidateDistance
    ? candidate
    : otherCandidate
}
