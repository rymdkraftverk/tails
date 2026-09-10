interface Player {
  id: string
  color: string
  score: number
  send: (channel: string, message: { event: string; payload?: unknown }) => void
  previousScore?: number
  ready?: boolean
}
