import { Channel } from 'common'
import protobufDescriptor from './protobuf/bundle.json'

// configuration explanation:
// https://jameshfisher.com/2017/01/17/webrtc-datachannel-reliability.html
export default [{
  // "udpLike"
  name:   Channel.UNRELIABLE,
  config: {
    ordered:        false,
    maxRetransmits: 0,
  },
  protobuf: {
    descriptor: protobufDescriptor,
    schemaKey:  'Message',
  },
},
{
  // "tcpLike"
  name:   Channel.RELIABLE,
  config: {
    ordered: true,
  },
}]
