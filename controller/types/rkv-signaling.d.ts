declare module 'rkv-signaling' {
  type ChannelConfig = {
    name: string
    config?: RTCDataChannelInit
    protobuf?: { descriptor: unknown; schemaKey: string }
  }

  type Send = (channelName: string, data: object) => void

  const signaling: {
    runInitiator: (options: {
      channelConfigs: ChannelConfig[]
      onClose: () => void
      onData: (data: never) => unknown
      receiverId: string
      wsAddress: string
    }) => Promise<(channelName: string) => (data: object) => void>
  }

  export default signaling
  export { type ChannelConfig, type Send }
}
