const R = require('ramda')

// Existing version of this somewhere?!
const except = R.curry((a, b) => R.reject(
  R.flip(R.contains)(b),
  a,
))

module.exports = {
  except,
}
