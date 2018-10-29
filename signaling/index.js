require('webrtc-adapter')

const runInitiator = require('./runInitiator')
const runReceiver = require('./runReceiver')
const Event = require('./event')

module.exports = {
  runInitiator,
  runReceiver,
  Event,
}
