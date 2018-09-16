import l1 from 'l1'
import { GAME_WIDTH, GAME_HEIGHT } from './rendering'
import * as TextStyle from './util/textStyle'
import bounce from './bounce'

const TIME_BETWEEN_NUMBERS = 36

const numbers = [
  '3',
  '2',
  '1',
  'START!',
]

export default () => new Promise((resolve) => {
  const countdown = l1.entity()
  l1.addBehavior(
    countdownBehavior(resolve),
    countdown,
  )
})

const countdownBehavior = resolve => ({
  endTime: TIME_BETWEEN_NUMBERS,
  data:    {
    index: 0,
  },
  loop:       true,
  onComplete: ({ data, entity }) => {
    if (data.text) {
      l1.destroy(data.text)
    }
    if (data.index === numbers.length) {
      l1.destroy(entity)
      resolve()
      return
    }

    const text = l1.text({
      parent: entity,
      x:      GAME_WIDTH / 2,
      y:      GAME_HEIGHT / 2,
      text:   numbers[data.index],
      style:  {
        ...TextStyle.BIG,
        fontSize: 92,
        fill:     'white',
        parent:   entity,
      },
    })

    text.asset.anchor.set(0.5)
    l1.addBehavior(
      bounce(0.04),
      text,
    )
    data.text = text

    data.index += 1
  },
})
