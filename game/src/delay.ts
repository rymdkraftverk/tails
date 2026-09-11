import * as l1 from 'l1'

export default (duration: number) => new Promise<void>((res) => {
  const delayBehavior = () => ({
    duration,
    onComplete: () => {
      res()
    },
  })
  l1.addBehavior(delayBehavior())
})
