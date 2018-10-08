import R from 'ramda'

const calculateMiddle = (borders, dimension) => {
  const { min, max } = borders[dimension]
  return (min + max) / 2
}

const isNode = tree =>
  R.pipe(
    R.isNil,
    R.not,
  )(tree.true || tree.false)

module.exports = {
  calculateMiddle,
  isNode,
}
