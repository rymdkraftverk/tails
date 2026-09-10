import * as R from 'ramda'
import { calculateMiddle, isNode } from './common'

const getNextDimension = (dim, borders) => {
  const dimensions = Object.keys(borders)

  const currentIndex = dimensions.indexOf(dim)
  const nextIndex = (currentIndex + 1) % dimensions.length
  return dimensions[nextIndex]
}

const createChildBorders = (borders, dimension, greaterThanMiddle) => {
  const middle = calculateMiddle(borders, dimension)

  const newMin = greaterThanMiddle
    ? middle
    : borders[dimension].min

  const newMax = greaterThanMiddle
    ? borders[dimension].max
    : middle

  return {
    ...borders,
    [dimension]: {
      min: newMin,
      max: newMax,
    },
  }
}

const createEmptySubTree = (greaterThanMiddle, { dimension, borders }) => {
  const nextDimension = getNextDimension(dimension, borders)
  const childBorders = createChildBorders(borders, dimension, greaterThanMiddle)

  return initEmptyTree(childBorders, nextDimension)
}

const splitLeafIntoNode = (options, tree) => {
  const { borders, dimension, value } = tree

  const emptyTree = {
    borders,
    dimension,
    true:  createEmptySubTree(true, tree),
    false: createEmptySubTree(false, tree),
  }

  return addEntityToTree(options, emptyTree, value)
}

const addEntityToTree = (options, tree, entity) => {
  // check if leaf
  if (tree.value) {
    const node = splitLeafIntoNode(options, tree)
    return addEntityToTree(options, node, entity)
  }

  if (isNode(tree)) {
    const coord = options.getCoord(entity, tree.dimension)
    const middle = calculateMiddle(tree.borders, tree.dimension)
    const surpassesMiddle = coord > middle

    const subTree = tree[surpassesMiddle]

    return {
      ...tree,
      [surpassesMiddle]: addEntityToTree(options, subTree, entity),
    }
  }

  // empty tree
  return {
    ...tree,
    value: entity,
  }
}

export const initEmptyTree = (borders, dimension = Object.keys(borders)[0]) => ({
  dimension,
  borders,
})

const addEntityToTreeExport = R.curry(({ getCoord }, tree, entity) => {
  const options = {
    getCoord: getCoord || ((e, d) => e[d]),
  }

  return addEntityToTree(options, tree, entity)
})

export { addEntityToTreeExport as addEntityToTree }
