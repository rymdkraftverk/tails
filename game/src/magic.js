const getNormalizer = (x1, x2) => (4 / ((x1 ** 2) + (x2 ** 2)))

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

export const createEaseOut = (endX, minSpeed = 0.5) => x => easeOut(endX, x, minSpeed)

const easeOut = (endX, x, minSpeed) => Math.max(Math.abs((endX - x)) * 0.1, minSpeed)

export const createEaseIn =
  (endX, modifier = 1, maxSpeed = 10) => x => easeIn(endX, x, maxSpeed, modifier)

const easeIn = (endX, x, maxSpeed, modifier) => Math.min(modifier / Math.abs((endX - x)), maxSpeed)

// export const createEaseInOut = (startX, endX, minSpeed = 0.5) => (x) => Math.max(Math.abs((endX - x)) * 0.1, minSpeed);

export const createSine = (start, end, speed) => (now) => {
  const middle = ((start + end) / 2)
  return middle + ((middle - start) * Math.sin((now * Math.PI * 2) / speed))
}
