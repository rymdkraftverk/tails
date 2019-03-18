// Mute logging
/* eslint-disable no-console */
global.console = {
  error: jest.fn(),
  log:   jest.fn(),
  warn:  jest.fn(),
}

const common = require('../common')

test('mappify', () => {
  expect(common.mappify(
    'name',
    [
      {
        name:  'foo',
        color: 'blue',
      },
      {
        name:  'bar',
        color: 'green',
      },
      {
        name:  'baz',
        color: 'yellow',
      },
    ],
  ))
    .toEqual({
      foo: {
        name:  'foo',
        color: 'blue',
      },
      bar: {
        name:  'bar',
        color: 'green',
      },
      baz: {
        name:  'baz',
        color: 'yellow',
      },
    })
})

test('makeOnRtcMessage', () => {
  // Without protobuf
  expect(common.makeOnRtcMessage(
    {
      onData: ({ foo }) => foo * 3,
    },
  )({
    data: '{ "foo": 2 }',
  }))
    .toEqual(6)
})

test('hoistInternal', () => {
  expect(common.hoistInternal(
    [
      {
        label: 'someotherchannel',
        name:  'bar',
      },
      {
        label: common.INTERNAL_CHANNEL.name,
        name:  'foo',
      },
      {
        label: 'somethirdchannel',
        name:  'baz',
      },
    ],
  ))
    .toEqual(
      [
        {
          label: common.INTERNAL_CHANNEL.name,
          name:  'foo',
        },
        [
          {
            label: 'someotherchannel',
            name:  'bar',
          },
          {
            label: 'somethirdchannel',
            name:  'baz',
          },
        ],
      ],
    )
})

test('onWsMessage', () => {
  const f = jest.fn()
  const g = jest.fn()

  common.onWsMessage({ f, g })(
    '{ "event": "f","payload": 2 }',
  )

  expect(f)
    .toHaveBeenCalled()
  expect(g)
    .not.toHaveBeenCalled()
})

test('packageChannels', () => {
  expect(common.packageChannels(
    [{
      name:   'reliable',
      schema: 'JSON',
    }, {
      name:   'unreliable',
      schema: 'protobuf',
    }],
    [{
      label: 'internal',
      rtc:   'RTC',
    }, {
      label: 'reliable',
      rtc:   'RTC',
    }, {
      label: 'unreliable',
      rtc:   'RTC',
    }],
  ))
    .toEqual([{
      channel: {
        label: 'reliable',
        rtc:   'RTC',
      },
      name:   'reliable',
      schema: 'JSON',
    }, {
      channel: {
        label: 'unreliable',
        rtc:   'RTC',
      },
      name:   'unreliable',
      schema: 'protobuf',
    }])
})

test('prettyId', () => {
  expect(common.prettyId('abcdefgh'))
    .toEqual('abcd')
})

test('rtcMapSend', () => {
  // Without protobuf
  const f = jest.fn()
  const g = jest.fn()

  common.rtcMapSend(
    {
      foo: {
        channel: {
          send:       g,
          readyState: common.ReadyState.OPEN,
        },
      },
      bar: {
        channel: {
          send:       f,
          readyState: common.ReadyState.OPEN,
        },
      },
    },
    'bar',
    { foo: 2 },
  )

  expect(f)
    .toHaveBeenCalledWith('{"foo":2}')
  expect(g)
    .not.toHaveBeenCalled()
})

test('warnNotFound', () => {
  common.warnNotFound('foo')(4321)
  expect(console.warn)
    .toHaveBeenCalledWith('[Foo not found] 4321')
})
/* eslint-enable no-console */
