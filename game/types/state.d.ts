import type { Color } from 'common'

declare global {
  type BotKind = 'spiral' | 'smart'

  interface Player {
    id: string
    color: keyof typeof Color
    score: number
    send: (channel: string, message: { event: string; payload?: unknown }) => void
    previousScore?: number
    ready?: boolean
    bot?: BotKind
  }
}
