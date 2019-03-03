import { state } from '../src/state'
import repo from '../src/repository'

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

  state.gameCode = 'HAXX'
})

// --- Read ---
test('identifiableScoreBoard', () => {
  expect(repo.identifiableScoreBoard())
    .toEqual({
      code:       'HAXX',
      scoreBoard: {
        red:    3,
        blue:   1,
        yellow: 2,
        green:  3,
      },
    })
})
