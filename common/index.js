const Channel = require('./channel')
const Color = require('./color')
const Event = require('./event')
const Command = require('./command')

const prettyId = id => id.substring(0, 4)

module.exports = {
  Channel,
  Color,
  Event,
  prettyId,
  Command,
}
