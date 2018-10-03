import R from 'ramda'
import { addEntityToTree, initEmptyTree } from './add-entity-to-tree'
import { nearestNeighbour } from './nearest-neighbour'

export const performanceTest = (entityCount) => {
  const entities = randomElements(entityCount)
  const entitiesToFind = randomElements(entityCount / 10)

  const constructStart = performance.now()
  const tree = constructTree(entities)
  const constructEnd = performance.now()

  console.log(`constructing KD-tree with ${entityCount} entities took ${constructEnd - constructStart} ms`)

  const treeStart = performance.now()
  testKdTree(tree, entitiesToFind)
  const treeEnd = performance.now()

  const listStart = performance.now()
  testList(entities, entitiesToFind)
  const listEnd = performance.now()

  console.log(`checking if ${entitiesToFind.length} entities collide with any of ${entityCount} entities took ${treeEnd - treeStart} ms using KD-Tree and ${listEnd - listStart} ms using a list`)
}

const randomElements = entityCount => R
  .range(0, entityCount)
  .map(() => ({
    x: 1280 * Math.random(),
    y: 720 * Math.random(),
  }))

const testKdTree = (tree, entitiesToFind) => {
  const updatedTree = addEntityToTree(tree, randomElements(1)[0])

  return entitiesToFind
    .map(e => [e, nearestNeighbour(updatedTree, e, isColliding(e))])
    .filter(([e, neighbour]) => isColliding(e, neighbour))
    .map(([e]) => e)
}

const testList = (entities, entitiesToFind) => {
  const updatedEntities = entities.concat(randomElements(1))

  return entitiesToFind
    .filter(e1 => updatedEntities.some(e2 => isColliding(e1, e2)))
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
  return distance < 4.43 // width & height of snake bodies at 10 playesr
})
