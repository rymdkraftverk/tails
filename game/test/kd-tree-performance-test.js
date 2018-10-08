import R from 'ramda'
import { addEntityToTree, initEmptyTree } from '../src/kd-tree/add-entity-to-tree'
import { nearestNeighbour } from '../src/kd-tree/nearest-neighbour'

export const performanceTest = (entityCount) => {
  const entities = randomElements(entityCount)

  const constructStart = performance.now()
  const tree = constructTree(entities)
  const constructEnd = performance.now()

  console.log(`constructing KD-tree with ${entityCount} entities took ${constructEnd - constructStart} ms`)

  const testIterations = 5000
  const entitiesToFind = randomElements(testIterations)
  const entitiesToAdd = randomElements(testIterations)

  const treeStart = performance.now()
  entitiesToFind.forEach(e => testKdTree(tree, e))
  const treeEnd = performance.now()

  const listStart = performance.now()
  entitiesToFind.forEach(e => testList(entities, e))
  const listEnd = performance.now()

  console.log(`adding one element and checking if it collides with any of ${entityCount} entities took on average ${(treeEnd - treeStart) / testIterations} ms using KD-Tree and ${(listEnd - listStart) / testIterations} ms using a list`)
}

const randomElements = entityCount => R
  .range(0, entityCount)
  .map(() => ({
    x: 1280 * Math.random(),
    y: 720 * Math.random(),
  }))

const testKdTree = (tree, entity) => {
  const updatedTree = addEntityToTree(tree, entity)

  const options = {
    earlyReturn: isColliding(entity),
    filter: e => e !== entity,
  }
  return nearestNeighbour(options, updatedTree, entity)
}

const testList = (entities, entity) => {
  const updatedEntities = entities.concat(entity)

  return updatedEntities
    .filter(e => e !== entity)
    .some(e2 => isColliding(entity, e2))
}
const constructTree = entities => entities
  .reduce(addEntityToTree, initEmptyTree({
    x: {
      min: 0,
      max: 1280,
    },
    y: {
      min: 0,
      max: 720,
    },
  }))

const isColliding = R.curry((e1, e2) => {
  const distance = Math.sqrt(((e1.x - e2.x) ** 2) + ((e1.y - e2.y) ** 2))
  return distance < 4.43 // width & height of snake bodies at 10 players
})
