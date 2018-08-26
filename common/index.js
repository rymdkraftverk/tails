const Color = require('./color')
const Event = require('./event')

const prettyId = id => id.substring(0, 4)

module.exports = {
  Color,
  Event,
  prettyId,
}
