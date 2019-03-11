import R from 'ramda'
import { addEntityToTree, initEmptyTree } from '../src/kd-tree/add-entity-to-tree'
import { nearestNeighbour } from '../src/kd-tree/nearest-neighbour'

const greenLogColor = '\x1b[32m'

export const performanceTest = (entityCount) => {
  const entities = randomElements(entityCount)

  const constructStart = performance.now()
  const tree = constructTree(entities)
  const constructEnd = performance.now()

  console.log(greenLogColor, `constructing KD-tree with ${entityCount} entities took ${constructEnd - constructStart} ms`)

  const testIterations = 5000
  const entitiesToFind = randomElements(testIterations)

  const treeStart = performance.now()
  entitiesToFind.forEach(e => testKdTree(tree, e))
  const treeEnd = performance.now()

  const listStart = performance.now()
  entitiesToFind.forEach(e => testList(entities, e))
  const listEnd = performance.now()

  console.log(greenLogColor, `adding one element and checking if it collides with any of ${entityCount} entities took on average ${(treeEnd - treeStart) / testIterations} ms using KD-Tree and ${(listEnd - listStart) / testIterations} ms using a list`)
}

const randomElements = entityCount => R
  .range(0, entityCount)
  .map(() => ({
    asset: {
      x: 1280 * Math.random(),
      y: 720 * Math.random(),
    },
  }))

const testKdTree = (tree, entity) => {
  const getCoord = (e, dim) => e.asset[dim]

  const addEntityOptions = {
    getCoord,
  }
  const updatedTree = addEntityToTree(addEntityOptions, tree, entity)

  const options = {
    getCoord,
    earlyReturn: isColliding(entity),
    filter:      e => e !== entity,
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
  .reduce(addEntityToTree({ getCoord: (en, d) => en.asset[d] }), initEmptyTree({
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
  const p1 = e1.asset
  const p2 = e2.asset
  const distance = Math.sqrt(((p1.x - p2.x) ** 2) + ((p1.y - p2.y) ** 2))
  return distance < 4.43 // width & height of snake bodies at 10 players
})

describe('performance comparison, kd-tree vs list. Add one entity to the data structure and check if another collides with anything', () => {
  test('100 entities in data structure before test', () => {
    performanceTest(100)
  })

  test('200 entities in data structure before test', () => {
    performanceTest(200)
  })

  test('300 entities in data structure before test', () => {
    performanceTest(300)
  })
})
