const color = require('./color')
const events = require('./events')

const prettyId = id => id.substring(0, 4)

module.exports = {
  COLOR:  color,
  EVENTS: events,
  prettyId,
}
