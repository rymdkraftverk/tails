import { Timer, Entity } from 'l1'

export default time => new Promise((res) => {
  const delay = Entity.addChild(Entity.getRoot())
  const timer = Timer.create({ duration: time })
  delay.behaviors.delay = {
    run: () => {
      if (Timer.run(timer)) {
        res()
        Entity.destroy(delay)
      }
    },
  }
})
