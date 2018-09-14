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
  const countdown = l1.entity({
    x: GAME_WIDTH / 2,
    y: GAME_HEIGHT / 2,
  })
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
  loop:     true,
  onUpdate: ({ counter }) => {
    console.log('UPDATING!!', counter)
  },
  onComplete: ({ data, entity }) => {
    console.log('SHOW TEXT!!')
    if (data.text) {
      l1.destroy(data.text)
    }
    const text = l1.text({
      text:  numbers[data.index],
      style: {
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
    if (data.index === numbers.length) {
      resolve()
      l1.destroy(entity)
    }
  },
})
