import * as l1 from 'l1'

const GENERATE_HOLE_MAX_TIME = 300
const GENERATE_HOLE_MIN_TIME = 60

const HOLE_LENGTH_MAX_TIME = 30
const HOLE_LENGTH_MIN_TIME = 10

export const createHoleMaker = (player, speed, speedMultiplier) => ({
  id:       `createHoleMaker-${player.id}`,
  duration: l1.getRandomInRange(
    GENERATE_HOLE_MIN_TIME,
    GENERATE_HOLE_MAX_TIME,
  ),
  onComplete: () => {
    l1.addBehavior(holeMaker(player, speed, speedMultiplier))
  },
})

const holeMaker = (player, speed, speedMultiplier) => ({
  id:       `holeMaker-${player.id}`,
  duration: l1.getRandomInRange(
    Math.ceil(HOLE_LENGTH_MIN_TIME * (speedMultiplier / speed)),
    Math.ceil(HOLE_LENGTH_MAX_TIME * (speedMultiplier / speed)),
  ),
  onInit: () => {
    player.preventTrail += 1
  },
  onComplete: () => {
    player.preventTrail -= 1
    l1.addBehavior(createHoleMaker(player, speed, speedMultiplier))
  },
})
