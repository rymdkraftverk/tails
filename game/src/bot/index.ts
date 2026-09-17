import type * as PIXI from 'pixi.js'

import { join, onPlayerLeave } from '..'
import { state } from '../state'
import smart from './smart'
import spiral from './spiral'

export const BotKind = {
  SPIRAL: 'spiral',
  SMART:  'smart',
} as const

const phoneless = () => ({
  id:        `bot:${crypto.randomUUID()}`,
  close:     () => {},
  send:      () => {},
  setOnData: () => {},
})

export const add = (kind: BotKind) => join(phoneless(), kind)

export const remove = (kind: BotKind) => {
  const bot = state.players.find(player => player.bot === kind)
  if (bot) onPlayerLeave(bot.id)
}

export const behavior = (player: PIXI.Container, kind: BotKind) => {
  switch (kind) {
    case BotKind.SPIRAL:
      return spiral(player)
    case BotKind.SMART:
      return smart(player)
    default:
      return null
  }
}

window.debug = {
  ...window.debug,
  addBot:         add,
  removeBot:      remove,
  addMockPlayers: (count: number) => Array
    .from({ length: count }, () => join(phoneless())),
}
