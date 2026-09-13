import * as l2 from 'l2'

export default (duration: number) => new Promise<void>((res) => {
  const delayBehavior = () => ({
    duration,
    onComplete: () => {
      res()
    },
  })
  l2.addBehavior(delayBehavior())
})
