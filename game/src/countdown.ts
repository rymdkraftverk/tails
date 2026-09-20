import * as l2 from 'l2'
import type { Behavior } from 'l2'
import * as PIXI from 'pixi.js'
import { GAME_WIDTH, GAME_HEIGHT } from './constant/rendering'
import * as TextStyle from './constant/textStyle'
import bounce from './bounce'
import Sound from './constant/sound'
import { HEADER_HEIGHT } from './header'

const TIME_BETWEEN_NUMBERS = 36

const numbers = [
  '3',
  '2',
  '1',
  'SURVIVE!',
]

const isOver = (i: number) => (i >= numbers.length)
const isLast = (i: number) => i === (numbers.length - 1)

const sound = (i: number) => (
  isLast(i)
    ? Sound.COUNTDOWN_END
    : Sound.COUNTDOWN
)

export default () => new Promise<void>((resolve) => {
  const countdown = new PIXI.Container()
  l2.add(countdown)
  l2.addBehavior(countdownBehavior(countdown, resolve))
})

type CountdownData = {
  index: number
  text:  PIXI.Text | null
}

const countdownBehavior = (countdown: PIXI.Container, resolve: () => void) => ({
  id:       'countdown',
  duration: TIME_BETWEEN_NUMBERS,
  data:     {
    index: 0,
    text:  null,
  } as CountdownData,
  loop:       true,
  onComplete: ({ data }: Behavior<CountdownData>) => {
    if (data.text) {
      l2.destroy(data.text)
    }
    if (isOver(data.index)) {
      l2.removeBehavior('countdown')
      l2.destroy(countdown)
      resolve()
      return
    }

    const text = new PIXI.Text({
      text:  numbers[data.index],
      style: {
        ...TextStyle.BIG,
        fontSize: 92,
        fill:     'white',
      },
    })
    l2.add(
      text,
      {
        parent: countdown,
      },
    )
    text.x = GAME_WIDTH / 2
    text.y = (GAME_HEIGHT - HEADER_HEIGHT) / 2
    text.anchor.set(0.5)
    l2.addBehavior(bounce(text, 0.02))
    data.text = text

    sound(data.index)()

    data.index += 1
  },
})
