const getNormalizer = (x1, x2) => (4 / ((x1 ** 2) + (x2 ** 2)))

const { error } = console

/**
 *
 * @param {number} x1 -
 * @param {number} x2 -
 * @param {number} y -
 * @param {number} [modifier]
 */
export const createParabola = (x1, x2, y, modifier = 1) => (x) => {
  const normalizer = getNormalizer(x1, x2)
  return y + ((Math.abs(x1 - x2) * modifier) * (normalizer * (x - x1) * (x - x2)))
}

export const createParabolaAngle = (x1, x2, modifier = 1) => (x) => {
  const normalizer = getNormalizer(x1, x2)
  return Math.atan((Math.abs(x1 - x2) * modifier) * normalizer * ((2 * x) - x1 - x2))
}

/**
 *
 * @param {*} endX
 * @param {*} minSpeed
 */
export const createEaseOut = (endX, minSpeed = 0.5) => x => easeOut(endX, x, minSpeed)

const easeOut = (endX, x, minSpeed) => Math.max(Math.abs((endX - x)) * 0.1, minSpeed)

/**
 *
 * @param {*} endX
 * @param {*} modifier
 * @param {*} maxSpeed
 */
export const createEaseIn =
  (endX, modifier = 1, maxSpeed = 10) => x => easeIn(endX, x, maxSpeed, modifier)

const easeIn = (endX, x, maxSpeed, modifier) => Math.min(modifier / Math.abs((endX - x)), maxSpeed)

export const createEaseInAndOut = ({
  start, end, duration, startTime = 0,
}) => {
  if (duration <= 0) {
    error('createEaseInAndOut: duration has to be positive')
  }
  const endTime = startTime + duration
  const speed = 4 * ((start - end) / ((startTime - endTime) ** 3))
  const positionOffset = (end + start) / 2
  const timeOffset = (endTime + startTime) / 2

  return t => (speed * ((t - timeOffset) ** 3)) + positionOffset
}

/**
 *
 * @param {*} start
 * @param {*} end
 * @param {*} speed
 */
export const createSine = (start, end, speed) => (now) => {
  const middle = ((start + end) / 2)
  return middle + ((middle - start) * Math.sin((now * Math.PI * 2) / speed))
}
