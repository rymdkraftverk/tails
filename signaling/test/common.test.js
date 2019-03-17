const common = require('../common')

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
