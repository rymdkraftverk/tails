const R = require('ramda')

const { warn } = console

const ReadyState = {
  OPEN: 'open',
}

const WEB_RTC_CONFIG = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
}

const serialize = JSON.stringify
const deserialize = JSON.parse

const makeWsSend = ws => (event, payload) => {
  const message = serialize({ event, payload })
  ws.send(message)
}

const rtcSend = (channel, data) => {
  if (channel.readyState !== ReadyState.OPEN) {
    warn(`Attempt to send ${data} to channel ${channel.label} in state ${channel.readyState}`)
    return
  }

  R.pipe(
    serialize,
    channel.send.bind(channel),
  )(data)
}

const onWsMessage = eventMap => (message) => {
  const { event, payload } = deserialize(message.data)
  const f = eventMap[event]
  if (!f) {
    warn(`Unhandled event for message: ${message.data}`)
    return
  }
  f(payload)
}

const mappify = (list, key) => list
  .map(x => ({ [x[key]]: x }))
  .reduce(R.merge)

const makeCloseConnections = connections => () => {
  connections.forEach((c) => {
    c.close()
  })
}

const makeOnMessage = onData => R.pipe(
  ({ data }) => data,
  deserialize,
  onData,
)

const makeRtcSend = (channels) => {
  const channelMap = mappify(channels, 'label')

  return R.curry((channelName, data) => {
    const channel = channelMap[channelName]
    rtcSend(channel, data)
  })
}

module.exports = {
  WEB_RTC_CONFIG,
  makeCloseConnections,
  makeOnMessage,
  makeRtcSend,
  makeWsSend,
  onWsMessage,
}
