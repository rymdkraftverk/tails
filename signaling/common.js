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

// reliable
const INTERNAL_CHANNEL = {
  name:   'internal',
  config: {
    ordered: true,
  },
}

const capitalize = R.pipe(
  R.juxt([
    R.pipe(
      R.head,
      R.toUpper,
    ),
    R.tail,
  ]),
  R.join(''),
)

const warnNotFound = targetName => R.pipe(
  targetId => `[${capitalize(targetName)} not found] ${targetId}`,
  warn,
)

const prettyId = id => id.substring(0, 4)

const serialize = JSON.stringify
const deserialize = JSON.parse

const wsSend = R.curry((ws, event, payload) => {
  R.pipe(
    serialize,
    R.bind(ws.send, ws),
  )({ event, payload })
})

const rtcSend = (channel, data) => {
  channel.send(serialize(data))
}

const rtcMapSend = R.curry((channelMap, channelName, data) => {
  const channel = channelMap[channelName]

  if (channel.readyState !== ReadyState.OPEN) {
    warn(`Attempt to send ${data} to channel ${channel.label} in state ${channel.readyState}`)
    return
  }

  rtcSend(channel, data)
})

const onWsMessage = eventMap => (message) => {
  const { event, payload } = deserialize(message)
  const f = eventMap[event]
  if (!f) {
    warn(`Unhandled event for message: ${message}`)
    return
  }
  f(payload)
}

const partitionInternal = R.pipe(
  R.partition(R.propEq('label', INTERNAL_CHANNEL.name)),
  ([internals, externals]) => [R.head(internals), externals],
)

const mappify = R.curry((key, list) => list
  .map(x => ({ [x[key]]: x }))
  .reduce(R.merge))

const makeCloseConnections = connections => () => {
  connections.forEach((c) => {
    c.close()
  })
}

const makeOnMessage = onData => R.pipe(
  R.prop('data'),
  deserialize,
  onData,
)

module.exports = {
  INTERNAL_CHANNEL,
  ReadyState,
  WEB_RTC_CONFIG,
  makeCloseConnections,
  makeOnMessage,
  mappify,
  onWsMessage,
  partitionInternal,
  prettyId,
  rtcMapSend,
  rtcSend,
  warnNotFound,
  wsSend,
}
