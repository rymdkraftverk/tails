import {
  calculateMiddle,
  isNode,
  type Borders,
  type GetCoord,
  type Tree,
} from './common'

const getNextDimension = (dim: string, borders: Borders) => {
  const dimensions = Object.keys(borders)

  const currentIndex = dimensions.indexOf(dim)
  const nextIndex = (currentIndex + 1) % dimensions.length
  return dimensions[nextIndex]
}

const createChildBorders = (borders: Borders, dimension: string, greaterThanMiddle: boolean) => {
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

const createEmptySubTree = <T>(
  greaterThanMiddle: boolean,
  { dimension, borders }: Tree<T>,
) => {
  const nextDimension = getNextDimension(dimension, borders)
  const childBorders = createChildBorders(borders, dimension, greaterThanMiddle)

  return initEmptyTree<T>(childBorders, nextDimension)
}

const splitLeafIntoNode = <T>(options: { getCoord: GetCoord<T> }, tree: Tree<T>): Tree<T> => {
  const { borders, dimension, value } = tree

  const emptyTree = {
    borders,
    dimension,
    true:  createEmptySubTree(true, tree),
    false: createEmptySubTree(false, tree),
  }

  return addEntityToTree(options, emptyTree, value as T)
}

const addEntityToTree = <T>(
  options: { getCoord: GetCoord<T> },
  tree: Tree<T>,
  entity: T,
): Tree<T> => {
  // check if leaf
  if (tree.value) {
    const node = splitLeafIntoNode(options, tree)
    return addEntityToTree(options, node, entity)
  }

  if (isNode(tree)) {
    const coord = options.getCoord(entity, tree.dimension)
    const middle = calculateMiddle(tree.borders, tree.dimension)

    return coord > middle
      ? { ...tree, true: addEntityToTree(options, tree.true as Tree<T>, entity) }
      : { ...tree, false: addEntityToTree(options, tree.false as Tree<T>, entity) }
  }

  // empty tree
  return {
    ...tree,
    value: entity,
  }
}

export const initEmptyTree = <T>(
  borders: Borders,
  dimension = Object.keys(borders)[0],
): Tree<T> => ({
  dimension,
  borders,
})

const addEntityToTreeExport = <T>(
  { getCoord }: { getCoord?: GetCoord<T> },
  tree: Tree<T>,
  entity: T,
) => addEntityToTree(
  { getCoord: getCoord || ((e, d) => (e as Record<string, number>)[d]) },
  tree,
  entity,
)

export { addEntityToTreeExport as addEntityToTree }
