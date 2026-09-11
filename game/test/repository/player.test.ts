import { state } from '../../src/state'
import repo from '../../src/repository/player'

const send = () => {}

beforeEach(() => {
  state.players = [
    {
      color:         'blue',
      send,
      id:            'foo',
      previousScore: 1,
      ready:         true,
      score:         1,
    },
    {
      color:         'red',
      send,
      id:            'bar',
      previousScore: 1,
      ready:         true,
      score:         3,
    },
    {
      color:         'yellow',
      send,
      id:            'baz',
      previousScore: 1,
      ready:         false,
      score:         2,
    },
    {
      color:         'green',
      send,
      id:            'qux',
      previousScore: 2,
      ready:         true,
      score:         3,
    },
  ]
})

// --- Read ---
test('allReady', () => {
  expect(repo.allReady())
    .toBe(false)

  state.players[2].ready = true
  expect(repo.allReady())
    .toBe(true)
})

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
      send,
      id:            'foo',
      previousScore: 1,
      ready:         true,
      score:         1,
    })
})

test('getReadyCount', () => {
  expect(repo.getReadyCount())
    .toBe(3)
})

test('getWithHighestScores', () => {
  expect(repo.getWithHighestScores())
    .toEqual([
      {
        color:         'red',
        send,
        id:            'bar',
        previousScore: 1,
        ready:         true,
        score:         3,
      },
      {
        color:         'green',
        send,
        id:            'qux',
        previousScore: 2,
        ready:         true,
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

test('add', () => {
  repo.add({
    color: 'pink',
    send,
    id:    'unique',
    extra: 'stuff',
  } as unknown as Player)

  expect(state.players)
    .toEqual([
      {
        color: 'pink',
        send,
        id:    'unique',
        extra: 'stuff',
      },
      {
        color:         'blue',
        send,
        id:            'foo',
        previousScore: 1,
        ready:         true,
        score:         1,
      },
      {
        color:         'red',
        send,
        id:            'bar',
        previousScore: 1,
        ready:         true,
        score:         3,
      },
      {
        color:         'yellow',
        send,
        id:            'baz',
        previousScore: 1,
        ready:         false,
        score:         2,
      },
      {
        color:         'green',
        send,
        id:            'qux',
        previousScore: 2,
        ready:         true,
        score:         3,
      },
    ])
})

test('incrementScores', () => {
  repo.incrementScores([
    'foo',
    'baz',
    'qux',
  ])

  expect(state.players)
    .toEqual([
      {
        color:         'blue',
        send,
        id:            'foo',
        previousScore: 1,
        ready:         true,
        score:         2,
      },
      {
        color:         'red',
        send,
        id:            'bar',
        previousScore: 1,
        ready:         true,
        score:         3,
      },
      {
        color:         'yellow',
        send,
        id:            'baz',
        previousScore: 1,
        ready:         false,
        score:         3,
      },
      {
        color:         'green',
        send,
        id:            'qux',
        previousScore: 2,
        ready:         true,
        score:         4,
      },
    ])
})

test('remove', () => {
  repo.remove('foo')
  expect(state.players)
    .toEqual([
      {
        color:         'red',
        send,
        id:            'bar',
        previousScore: 1,
        ready:         true,
        score:         3,
      },
      {
        color:         'yellow',
        send,
        id:            'baz',
        previousScore: 1,
        ready:         false,
        score:         2,
      },
      {
        color:         'green',
        send,
        id:            'qux',
        previousScore: 2,
        ready:         true,
        score:         3,
      },
    ])
})

test('resetReady', () => {
  repo.resetReady()
  expect(state.players)
    .toEqual([
      {
        color:         'blue',
        send,
        id:            'foo',
        previousScore: 1,
        ready:         false,
        score:         1,
      },
      {
        color:         'red',
        send,
        id:            'bar',
        previousScore: 1,
        ready:         false,
        score:         3,
      },
      {
        color:         'yellow',
        send,
        id:            'baz',
        previousScore: 1,
        ready:         false,
        score:         2,
      },
      {
        color:         'green',
        send,
        id:            'qux',
        previousScore: 2,
        ready:         false,
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
        send,
        id:            'foo',
        previousScore: 0,
        ready:         true,
        score:         0,
      },
      {
        color:         'red',
        send,
        id:            'bar',
        previousScore: 0,
        ready:         true,
        score:         0,
      },
      {
        color:         'yellow',
        send,
        id:            'baz',
        previousScore: 0,
        ready:         false,
        score:         0,
      },
      {
        color:         'green',
        send,
        id:            'qux',
        previousScore: 0,
        ready:         true,
        score:         0,
      },
    ])
})
