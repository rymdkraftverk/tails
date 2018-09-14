import l1 from 'l1'

export default endTime => new Promise((res) => {
  const delay = l1.entity()
  const delayBehavior = () => ({
    endTime,
    onComplete: () => {
      res()
      l1.destroy(delay)
    },
  })
  l1.addBehavior(delayBehavior(), delay)
})
