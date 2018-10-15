import { addEntityToTree, initEmptyTree, nearestNeighbour } from '../src/kd-tree'

const constructTree = (options, entities) => {
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
    .reduce((tree, entity) => addEntityToTree(options, tree, entity), emptyTree)
}

const parseOptions = ({ earlyReturn, filter }) => {
  const settings = {
    earlyReturn: {
      true:  () => true,
      false: null,
    },
    filter: {
      true:  e => e.filter,
      false: null,
    },
  }

  return {
    earlyReturn: settings.earlyReturn[earlyReturn],
    filter:      settings.filter[filter],
    getCoord:    (e, dim) => e.asset[dim],
  }
}

const parseEntity = ([x, y, filter]) => ({ filter, asset: { x, y } })

// see explanations of tests 3 and 4 in the comments at the bottom of the file
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
  const parsedEntities = entities.map(parseEntity)
  const parsedEntity = parseEntity(entity)
  const expected = parseEntity(expectedNearestEntity)

  const description = `The closest neighbour of ${JSON.stringify(parsedEntity)} should be ${JSON.stringify(expected)}`

  test(description, () => {
    const tree = constructTree(parsedOptions, parsedEntities)

    const nearestEntity = nearestNeighbour(parsedOptions, tree, parsedEntity)

    expect(nearestEntity)
      .toEqual(expected)
  })
})

/*
 * Explanation of test 3
 *
 * x = (6, 10)
 * a = (0, 0)
 * b = (10, 10)
 * c = (4, 10)
 * ____________________
 * |        c|x       b|
 * |         |         |
 * |         |         |
 * |         |         |
 * +---------+---------+
 * |         |         |
 * |         |         |
 * |         |         |
 * |a________|_________|
 *
 * x is closer to c than b. But x and b
 * are in the same quadrant
 *
 * Thus the algorithm will find b first and then early return
 */

/*
 * Explanation of test 4
 *
 * x = (6, 10)
 * a = (0, 0)
 * b = (10, 10)
 * c = (4, 10)
 * d = (10, 0)
 * ____________________
 * |        c|x       b|
 * |         |         |
 * |         |         |
 * |         |         |
 * |         |         |
 * +---------+---------+
 * |         |         |
 * |         |         |
 * |         |         |
 * |         |         |
 * |a________|________d|
 *
 * x is closest to b, but that is ignored by the filter option.
 * Ignoring b, c will be the closest. But when the algorithm starts backing
 * up the tree it will hit d first because of the order that the dimensions
 * are being cycled through.
 *
 * Since the early return predicate will accept anything we will never check c.
 * d will be what's returned in the end.
 *
 * This is dependent on an implementation detail on the order of the
 * dimensions in the tree. That doesn't really feel good from a unit test
 * perspective, but I couldn't come up with a good way of testing the early
 * return functionality as the caller, by definition, doesn't care what's
 * returned as long as it fulfills the early return predicate.
 */
