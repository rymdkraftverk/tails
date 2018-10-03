import { GAME_WIDTH, GAME_HEIGHT } from '../rendering'
import { dimensions, calculateLimit } from './common'

const getNextDimension = (dim) => {
  const currentIndex = dimensions.indexOf(dim)
  const nextIndex = (currentIndex + 1) % dimensions.length
  return dimensions[nextIndex]
}

const createChildBorders = (borders, dimension, greaterThanLimit) => {
  const limit = calculateLimit(borders, dimension)

  const newMin = greaterThanLimit
    ? limit
    : borders[dimension].min

  const newMax = greaterThanLimit
    ? borders[dimension].max
    : limit

  return {
    ...borders,
    [dimension]: {
      min: newMin,
      max: newMax,
    },
  }
}

const splitLeafIntoNode = ({ dimension, borders, value }) => {
  const entity = value
  const nextDimension = getNextDimension(dimension)

  const limit = calculateLimit(borders, dimension)

  const greaterThanLimit = entity[dimension] > limit

  const childBorders = createChildBorders(borders, dimension, greaterThanLimit)

  return {
    dimension,
    borders,
    [greaterThanLimit]: addEntityToTree(
      { dimension: nextDimension, borders: childBorders },
      entity,
    ),
  }
}

export const addEntityToTree = (tree, entity) => {
  // check if leaf
  if (tree.value) {
    const node = splitLeafIntoNode(tree)
    return addEntityToTree(node, entity)
  }

  // check if node
  if (tree.true || tree.false) {
    const surpassesLimit = entity[tree.dimension] > calculateLimit(tree.borders, tree.dimension)
    const subTree = tree[surpassesLimit] || initEmptyTree(
      createChildBorders(tree.borders, tree.dimension, surpassesLimit),
      getNextDimension(tree.dimension),
    )

    return {
      ...tree,
      [surpassesLimit]: addEntityToTree(subTree, entity),
    }
  }

  // empty tree
  return {
    dimension: tree.dimension,
    borders:   tree.borders,
    value:     entity,
  }
}

export const initEmptyTree = (borders, dimension = dimensions[0]) => ({
  dimension,
  borders: borders || {
    x: {
      min: 0,
      max: GAME_WIDTH,
    },
    y: {
      min: 0,
      max: GAME_HEIGHT,
    },
  },
})
