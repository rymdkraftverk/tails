import { Entity, Text, Timer } from 'l1'
import { GAME_WIDTH, GAME_HEIGHT } from './rendering'
import { big } from './util/textStyles'
import bounce from './bounce'

const TIME_BETWEEN_NUMBERS = 40

const numbers = [
  '3',
  '2',
  '1',
  'START!',
]

export default () => new Promise((resolve) => {
  const countdown = Entity.addChild(
    Entity.getRoot(),
    {
      x: GAME_WIDTH / 2,
      y: GAME_HEIGHT / 2,
    },
  )
  countdown.behaviors.countdown = countdownBehavior(resolve)
})

const showText = (entity, text) => {
  Text.hide(entity)
  const asset = Text.show(entity, {
    text,
    style: {
      ...big,
      fill: 'white',
    },
  })
  asset.anchor.set(0.5)
  entity.behaviors.bounce = bounce()
}

const countdownBehavior = resolve => ({
  timer: Timer.create({ duration: TIME_BETWEEN_NUMBERS }),
  index: 0,
  run:   (b, e) => {
    if (Timer.run(b.timer)) {
      showText(e, numbers[b.index])

      b.index += 1
      Timer.reset(b.timer)
      if (b.index === numbers.length + 1) {
        resolve()
        Entity.destroy(e)
      }
    }
  },
})
