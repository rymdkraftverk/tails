const { packageChannels } = require('../common')

test('joins matching elements', () => {
  expect(packageChannels(
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
