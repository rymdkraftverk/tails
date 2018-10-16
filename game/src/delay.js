import * as l1 from 'l1'

export default duration => new Promise((res) => {
  const delayBehavior = () => ({
    duration,
    onComplete: () => {
      res()
    },
  })
  l1.addBehavior(delayBehavior())
})
