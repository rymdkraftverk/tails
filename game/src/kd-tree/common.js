
const dimensions = ['x', 'y']

const calculateLimit = (borders, dimension) => {
  const { min, max } = borders[dimension]
  return (min + max) / 2
}

module.exports = {
  dimensions,
  calculateLimit,
}
