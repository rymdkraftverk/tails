import { state } from '../../src/state'
import repo from '../../src/repository'

const send = () => {}

beforeEach(() => {
  state.players = [
    {
      color:         'blue',
      send,
      id:            'foo',
      previousScore: 0,
      score:         1,
    },
    {
      color:         'red',
      send,
      id:            'bar',
      previousScore: 0,
      score:         3,
    },
    {
      color:         'yellow',
      send,
      id:            'baz',
      previousScore: 0,
      score:         2,
    },
    {
      color:         'green',
      send,
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
