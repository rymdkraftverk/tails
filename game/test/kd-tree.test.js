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

describe('nearestNeighbour', () => {
  it('no filter, no early return', () => {
    const entities = [
      {
        x: 0,
        y: 0,
      },
      {
        x: 0,
        y: 10,
      },
      {
        x: 10,
        y: 10,
      },
    ]

    const tree = constructTree(entities)

    const entity = {
      x: 8,
      y: 8,
    }

    const closestEntity = nearestNeighbour({}, tree, entity)

    expect(closestEntity)
      .toEqual(entities[2]) // (10, 10)
  })

  it('using filter, no early return', () => {
    const entities = [
      {
        x:    0,
        y:    0,
        type: 'included',
      },
      {
        x:    0,
        y:    10,
        type: 'included',
      },
      {
        x:    10,
        y:    10,
        type: 'ignored',
      },
    ]

    const tree = constructTree(entities)

    const entity = {
      x: 8,
      y: 8,
    }

    const options = {
      filter: e => e.type === 'included',
    }

    const closestEntity = nearestNeighbour(options, tree, entity)

    expect(closestEntity)
      .toEqual(entities[1]) // (0, 10)
  })

  it('no filter, using early return', () => {
    const entities = [
      {
        x: 0,
        y: 0,
      },
      {
        x: 10,
        y: 10,
      },
      {
        x: 4,
        y: 10,
      },
    ]

    const tree = constructTree(entities)

    const entity = {
      x: 6,
      y: 10,
    }

    const options = {
      earlyReturn: () => true,
    }

    const closestEntity = nearestNeighbour(options, tree, entity)

    /*
     * x = (6, 10)
     * a = (0, 0)
     * b = (10, 10)
     * c = (4, 10)
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
     * |a________|_________|
     *
     * x is closer to c than b. But x and b
     * are in the same quadrant
     *
     * Thus the algorithm will find c first and then early return
     *
     */
    expect(closestEntity)
      .toEqual(entities[1]) // b
  })

  it('using filter, using early return', () => {
    const entities = [
      {
        x:    0,
        y:    0,
        type: 'included',
      },
      {
        x:    10,
        y:    10,
        type: 'ignored',
      },
      {
        x:    4,
        y:    10,
        type: 'included',
      },
      {
        x:    10,
        y:    0,
        type: 'included',
      },
    ]

    const tree = constructTree(entities)

    const entity = {
      x: 6,
      y: 10,
    }

    const options = {
      earlyReturn: () => true,
      filter:      e => e.type === 'included',
    }

    const closestEntity = nearestNeighbour(options, tree, entity)

    /*
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
    expect(closestEntity)
      .toEqual(entities[3]) // d
  })
})
