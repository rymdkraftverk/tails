const Channel = require('./channel')
const Color = require('./color')
const Event = require('./event')
const SteeringCommand = require('./steeringCommand')

const prettyId = id => id.substring(0, 4)

module.exports = {
  Channel,
  Color,
  Event,
  prettyId,
  SteeringCommand,
}
