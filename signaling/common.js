const R = require('ramda')
const pb = require('protobufjs/light')

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

const innerJoinWith = R.curry((join, pred, t1, t2) => R.map(
  (t1r) => {
    const t2r = R.find(pred(t1r), t2) || {}
    return join(t1r, t2r)
  },
  t1,
))

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

const defaultSerialize = JSON.stringify
const defaultDeserialize = JSON.parse

// TODO: don't reload schema on every de(serialization)
const protobufSchema = (descriptor, schemaKey) => pb.Root.fromJSON(descriptor)[schemaKey]

const protobufSerializer = ({ descriptor, schemaKey }) => data =>
  protobufSchema(descriptor, schemaKey)
    .encode(data)
    .finish()

const protobufDeserializer = ({ descriptor, schemaKey }) => data =>
  protobufSchema(descriptor, schemaKey)
    .decode(new Uint8Array(data))

const wsSend = R.curry((ws, event, payload) => {
  R.pipe(
    defaultSerialize,
    R.bind(ws.send, ws),
  )({ event, payload })
})

const rtcSend = (serialize, channel, data) => {
  channel.send(serialize(data))
}

const rtcMapSend = R.curry((channelMap, channelName, data) => {
  const { channel, protobuf } = channelMap[channelName]

  if (channel.readyState !== ReadyState.OPEN) {
    warn(`Attempt to send ${data} to channel ${channel.label} in state ${channel.readyState}`)
    return
  }

  const serialize = protobuf ? protobufSerializer(protobuf) : defaultSerialize

  rtcSend(serialize, channel, data)
})

const onWsMessage = eventMap => (message) => {
  const { event, payload } = defaultDeserialize(message)
  const f = eventMap[event]
  if (!f) {
    warn(`Unhandled event for message: ${message}`)
    return
  }
  f(payload)
}

const hoistInternal = R.pipe(
  R.partition(R.propEq('label', INTERNAL_CHANNEL.name)),
  ([internals, externals]) => [R.head(internals), externals],
)

const mappify = R.curry((key, list) => list
  .map(x => ({ [x[key]]: x }))
  .reduce(R.merge))

const packageChannels = innerJoinWith(
  (info, channel) => R.merge({ channel }, info),
  R.curry((info, channel) => info.name === channel.label),
)

const makeCloseConnections = connections => () => {
  connections.forEach((c) => {
    c.close()
  })
}

const makeOnMessage = (deserialize, onData) => R.pipe(
  R.prop('data'),
  deserialize,
  onData,
)

module.exports = {
  INTERNAL_CHANNEL,
  ReadyState,
  WEB_RTC_CONFIG,
  hoistInternal,
  makeCloseConnections,
  makeOnMessage,
  mappify,
  onWsMessage,
  packageChannels,
  prettyId,
  protobufDeserializer,
  protobufSerializer,
  rtcMapSend,
  rtcSend,
  warnNotFound,
  wsSend,
}
