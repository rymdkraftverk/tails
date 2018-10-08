import { GAME_WIDTH, GAME_HEIGHT } from '../rendering'
import { calculateMiddle, isNode } from './common'
import DIMENSIONS from './dimensions'

const getNextDimension = (dim) => {
  const currentIndex = DIMENSIONS.indexOf(dim)
  const nextIndex = (currentIndex + 1) % DIMENSIONS.length
  return DIMENSIONS[nextIndex]
}

const createChildBorders = (borders, dimension, greaterThanMiddle) => {
  const limit = calculateMiddle(borders, dimension)

  const newMin = greaterThanMiddle
    ? limit
    : borders[dimension].min

  const newMax = greaterThanMiddle
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

  const limit = calculateMiddle(borders, dimension)

  const greaterThanMiddle = entity[dimension] > limit

  const childBorders = createChildBorders(borders, dimension, greaterThanMiddle)

  return {
    dimension,
    borders,
    [greaterThanMiddle]: addEntityToTree(
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
  if (isNode(tree)) {
    const surpassesMiddle = entity[tree.dimension] > calculateMiddle(tree.borders, tree.dimension)
    const subTree = tree[surpassesMiddle] || initEmptyTree(
      createChildBorders(tree.borders, tree.dimension, surpassesMiddle),
      getNextDimension(tree.dimension),
    )

    return {
      ...tree,
      [surpassesMiddle]: addEntityToTree(subTree, entity),
    }
  }

  // empty tree
  return {
    dimension: tree.dimension,
    borders:   tree.borders,
    value:     entity,
  }
}

export const initEmptyTree = (borders, dimension) => ({
  dimension: dimension || DIMENSIONS[0],
  borders:   borders || {
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
