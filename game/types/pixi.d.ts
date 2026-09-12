import 'pixi.js'
import EventEmitter from 'eventemitter3'
import type { Color } from 'common'

declare module 'pixi.js' {
  // Expando properties the game hangs on the display objects l1 manages
  interface Container {
    active: boolean
    alive: boolean
    color: keyof typeof Color
    counter: number
    degrees: number
    event: EventEmitter
    fatLevel: number
    id: string
    l1: {
      id: string
      labels: string[]
      zIndex: number | null
      isDestroyed: () => boolean
      originalSize?: number
    }
    player: string
    preventTrail: number
    scaleFactor: number
    speed: number
    sprite: Sprite
    trailContainer: Container
    trailSpriteContainer: Container
    turnRate: number
  }
}
