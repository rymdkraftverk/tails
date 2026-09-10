import * as R from 'ramda'
import { initEmptyTree } from './addEntityToTree'

const isLeaf = tree => tree.value
const isEmptyTree = tree => !tree.value && !tree.true && !tree.false

const filter = (options, predicate, tree) => {
  if (isEmptyTree(tree)) {
    return tree
  }

  if (isLeaf(tree)) {
    return predicate(tree.value)
      ? tree
      : initEmptyTree(tree.borders, tree.dimension)
  }

  const updatedTrueSide = filter(options, predicate, tree.true)
  const updatedFalseSide = filter(options, predicate, tree.false)

  // if both branches are empty then they get pruned down to one to remove
  // unnecessary, empty layers.
  //
  // This can't happen if only one entity is deleted at a time since a leaf can
  // never have an empty, direct sibling
  if (isEmptyTree(updatedTrueSide) && isEmptyTree(updatedFalseSide)) {
    return initEmptyTree(tree.borders, tree.dimension)
  }

  // if one side is a leaf and the other is empty, then the leaf should
  // propagate upwards to remove redundant layers
  if (isLeaf(updatedTrueSide) && isEmptyTree(updatedFalseSide)) {
    return {
      borders:   tree.borders,
      dimension: tree.dimension,
      value:     updatedTrueSide.value,
    }
  }

  if (isLeaf(updatedFalseSide) && isEmptyTree(updatedTrueSide)) {
    return {
      borders:   tree.borders,
      dimension: tree.dimension,
      value:     updatedFalseSide.value,
    }
  }

  return {
    ...tree,
    true:  updatedTrueSide,
    false: updatedFalseSide,
  }
}

const filterExport = R.curry(filter)

export { filterExport as filter }
