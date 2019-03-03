import { state } from '../src/state'
import repo from '../src/playerRepository'

beforeEach(() => {
  state.players = [
    {
      color:         'blue',
      id:            'foo',
      previousScore: 0,
      score:         1,
    },
    {
      color:         'red',
      id:            'bar',
      previousScore: 0,
      score:         3,
    },
    {
      color:         'yellow',
      id:            'baz',
      previousScore: 0,
      score:         2,
    },
    {
      color:         'green',
      id:            'qux',
      previousScore: 0,
      score:         3,
    },
  ]
})

// --- Read ---
test('count', () => {
  expect(repo.count())
    .toBe(4)
})

test('countFactor', () => {
  expect(repo.countFactor())
    .toBe(2)
})

test('find', () => {
  expect(repo.find('foo'))
    .toEqual({
      color:         'blue',
      id:            'foo',
      previousScore: 0,
      score:         1,
    })
})

test('getWithHighestScores', () => {
  expect(repo.getWithHighestScores())
    .toEqual([
      {
        color:         'red',
        id:            'bar',
        previousScore: 0,
        score:         3,
      },
      {
        color:         'green',
        id:            'qux',
        previousScore: 0,
        score:         3,
      },
    ])
})

test('isFirstPlace', () => {
  expect(repo.isFirstPlace('foo'))
    .toBe(false)

  expect(repo.isFirstPlace('bar'))
    .toBe(true)
})

test('scoreToWin', () => {
  expect(repo.scoreToWin())
    .toBe(9)
})

// --- Write ---

test('remove', () => {
  repo.remove('foo')
  expect(state.players)
    .toEqual([
      {
        color:         'red',
        id:            'bar',
        previousScore: 0,
        score:         3,
      },
      {
        color:         'yellow',
        id:            'baz',
        previousScore: 0,
        score:         2,
      },
      {
        color:         'green',
        id:            'qux',
        previousScore: 0,
        score:         3,
      },
    ])
})

test('resetScores', () => {
  repo.resetScores()
  expect(state.players)
    .toEqual([
      {
        color:         'blue',
        id:            'foo',
        previousScore: 0,
        score:         0,
      },
      {
        color:         'red',
        id:            'bar',
        previousScore: 0,
        score:         0,
      },
      {
        color:         'yellow',
        id:            'baz',
        previousScore: 0,
        score:         0,
      },
      {
        color:         'green',
        id:            'qux',
        previousScore: 0,
        score:         0,
      },
    ])
})
