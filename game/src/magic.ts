const getNormalizer = (x1: number, x2: number) => (4 / ((x1 ** 2) + (x2 ** 2)))

const { error } = console

export const createParabola = ({
  start, end, offset, modifier = 1,
}: {
  start:     number;
  end:       number;
  offset:    number;
  modifier?: number;
}) => (t: number) => {
  const normalizer = getNormalizer(start, end)
  return offset + ((Math.abs(start - end) * modifier) * (normalizer * (t - start) * (t - end)))
}

export const createParabolaAngle = (x1: number, x2: number, modifier = 1) => (x: number) => {
  const normalizer = getNormalizer(x1, x2)
  return Math.atan((Math.abs(x1 - x2) * modifier) * normalizer * ((2 * x) - x1 - x2))
}

export const createEaseOut = (endX: number, minSpeed = 0.5) => (x: number) => (
  easeOut(endX, x, minSpeed)
)

const easeOut = (endX: number, x: number, minSpeed: number) => (
  Math.max(Math.abs((endX - x)) * 0.1, minSpeed)
)

export const createEaseIn = (
  endX: number,
  modifier = 1,
  maxSpeed = 10,
) => (x: number) => easeIn(endX, x, maxSpeed, modifier)

const easeIn = (endX: number, x: number, maxSpeed: number, modifier: number) => (
  Math.min(modifier / Math.abs((endX - x)), maxSpeed)
)

export const createEaseInAndOut = ({
  start, end, duration, startTime = 0,
}: {
  start:      number;
  end:        number;
  duration:   number;
  startTime?: number;
}) => {
  if (duration <= 0) {
    error('createEaseInAndOut: duration has to be positive')
  }
  const endTime = startTime + duration
  const speed = 4 * ((start - end) / ((startTime - endTime) ** 3))
  const positionOffset = (end + start) / 2
  const timeOffset = (endTime + startTime) / 2

  return (t: number) => (speed * ((t - timeOffset) ** 3)) + positionOffset
}

export const createSine = ({
  start, end, speed,
}: {
  start: number;
  end:   number;
  speed: number;
}) => (t: number) => {
  const middle = ((start + end) / 2)
  return middle + ((middle - start) * Math.sin((t * Math.PI * 2) / speed))
}
