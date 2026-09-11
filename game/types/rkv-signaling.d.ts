declare module 'rkv-signaling' {
  type Send = (channelName: string, data: object) => void

  type Initiator = {
    id: string
    setOnData: (onData: (message: { event: string; payload: never }) => void) => void
    send: Send
    close: () => void
  }

  const signaling: {
    runReceiver: (options: {
      wsAddress: string
      receiverId: string
      onInitiatorJoin: (initiator: Initiator) => void
      onInitiatorLeave: (initiatorId: string) => void
    }) => Promise<void>
  }

  export default signaling
  export { type Initiator, type Send }
}
