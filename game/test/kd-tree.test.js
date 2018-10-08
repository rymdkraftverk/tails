import { addEntityToTree, initEmptyTree, nearestNeighbour } from '../src/kd-tree'

const constructTree = (entities) => {
  const emptyTree = initEmptyTree({
    x: {
      min: 0,
      max: 10,
    },
    y: {
      min: 0,
      max: 10,
    },
  })


  return entities
    .reduce(addEntityToTree, emptyTree)
}

const parseOptions = ({ earlyReturn, filter }) => {
  const settings = {
    earlyReturn: {
      true:  () => true,
      false: null,
    },
    filter: {
      true:  ({ include }) => include,
      false: null,
    },
  }

  return {
    earlyReturn: settings.earlyReturn[earlyReturn],
    filter:      settings.filter[filter],
  }
}

describe.each`
  options                                  | entities                                                         | entity     | expectedNearestEntity
  ${{ earlyReturn: false, filter: false }} | ${[[0, 0, true], [0, 10, true], [10, 10, true]]}                 | ${[8, 8]}  | ${[10, 10, true]}
  ${{ earlyReturn: false, filter: true }}  | ${[[0, 0, true], [0, 10, true], [10, 10, false]]}                | ${[8, 8]}  | ${[0, 10, true]}
  ${{ earlyReturn: true, filter: false }}  | ${[[0, 0, true], [10, 10, true], [4, 10, true]]}                 | ${[6, 10]} | ${[10, 10, true]}
  ${{ earlyReturn: true, filter: true }}   | ${[[0, 0, true], [10, 10, false], [4, 10, true], [10, 0, true]]} | ${[6, 10]} | ${[10, 0, true]}
`('find nearest entity', ({
  options,
  entities,
  entity,
  expectedNearestEntity,
}) => {
  const parsedOptions = parseOptions(options)
  const parsedEntities = entities.map(([x, y, include]) => ({ x, y, include }))
  const parsedEntity = { x: entity[0], y: entity[1] }
  const expected = {
    x:       expectedNearestEntity[0],
    y:       expectedNearestEntity[1],
    include: expectedNearestEntity[2],
  }

  const description = `The closest neighbour of ${JSON.stringify(parsedEntity)} should be ${JSON.stringify(expected)}`

  test(description, () => {
    const tree = constructTree(parsedEntities)

    const nearestEntity = nearestNeighbour(parsedOptions, tree, parsedEntity)

    expect(nearestEntity)
      .toEqual(expected)
  })
})
