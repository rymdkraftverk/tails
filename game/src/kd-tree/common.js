import R from 'ramda'

const dimensions = ['x', 'y']

const calculateLimit = (borders, dimension) => {
  const { min, max } = borders[dimension]
  return (min + max) / 2
}

const isNode = tree =>
  R.pipe(
    R.isNil,
    R.not,
  )(tree.true || tree.false)

module.exports = {
  dimensions,
  calculateLimit,
  isNode,
}
