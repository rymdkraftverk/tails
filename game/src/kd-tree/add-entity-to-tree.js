import R from 'ramda'
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

const splitLeafIntoNode = (options, { dimension, borders, value }) => {
  const entity = value
  const nextDimension = getNextDimension(dimension)

  const limit = calculateMiddle(borders, dimension)

  const { getCoord } = options
  const greaterThanMiddle = getCoord(entity, dimension) > limit

  const childBorders = createChildBorders(borders, dimension, greaterThanMiddle)

  return {
    dimension,
    borders,
    [greaterThanMiddle]: addEntityToTree(
      options,
      { dimension: nextDimension, borders: childBorders },
      entity,
    ),
  }
}

const addEntityToTree = (options, tree, entity) => {
  const { getCoord } = options

  // check if leaf
  if (tree.value) {
    const node = splitLeafIntoNode(options, tree)
    return addEntityToTree(options, node, entity)
  }

  // check if node
  if (isNode(tree)) {
    const coord = getCoord(entity, tree.dimension)
    const middle = calculateMiddle(tree.borders, tree.dimension)
    const surpassesMiddle = coord > middle

    const subTree = tree[surpassesMiddle] || initEmptyTree(
      createChildBorders(tree.borders, tree.dimension, surpassesMiddle),
      getNextDimension(tree.dimension),
    )

    return {
      ...tree,
      [surpassesMiddle]: addEntityToTree(options, subTree, entity),
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

const addEntityToTreeExport = R.curry((options, tree, entity) => {
  const options2 = {
    getCoord: (e, d) => e[d],
    ...options,
  }

  return addEntityToTree(options2, tree, entity)
})

export { addEntityToTreeExport as addEntityToTree }
