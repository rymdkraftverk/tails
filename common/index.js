const colors = require('./colors')
const events = require('./events')

const prettyId = id => id.substring(0, 4)

module.exports = {
  COLORS: colors,
  EVENTS: events,
  prettyId,
}
