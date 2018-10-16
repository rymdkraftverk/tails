import * as l1 from 'l1'
import * as PIXI from 'pixi.js'
import { GAME_WIDTH, GAME_HEIGHT } from './rendering'
import * as TextStyle from './util/textStyle'
import bounce from './bounce'

const TIME_BETWEEN_NUMBERS = 36

const numbers = [
  '3',
  '2',
  '1',
  'SURVIVE!',
]

export default () => new Promise((resolve) => {
  const countdown = new PIXI.Container()
  l1.add(countdown)
  l1.addBehavior(countdownBehavior(countdown, resolve))
})

const countdownBehavior = (countdown, resolve) => ({
  id:       'countdown',
  duration: TIME_BETWEEN_NUMBERS,
  data:     {
    index: 0,
  },
  loop:       true,
  onComplete: ({ data }) => {
    if (data.text) {
      l1.destroy(data.text)
    }
    if (data.index === numbers.length) {
      l1.removeBehavior('countdown')
      l1.destroy(countdown)
      resolve()
      return
    }

    const text = new PIXI.Text(
      numbers[data.index],
      {
        ...TextStyle.BIG,
        fontSize: 92 * l1.getScale(),
        fill:     'white',
      },
    )
    l1.add(
      text,
      {
        parent: countdown,
      },
    )
    text.x = GAME_WIDTH / 2
    text.y = GAME_HEIGHT / 2
    text.anchor.set(0.5)
    l1.addBehavior(bounce(text, 0.04))
    data.text = text

    data.index += 1
  },
})
