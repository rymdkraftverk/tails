import 'pixi.js'
import EventEmitter from 'eventemitter3'

declare module 'pixi.js' {
  interface Container {
    active: boolean
    counter: number
    player: string
    sprite: Sprite
    trailContainer: Container
  }

  interface Sprite {
    alive: boolean
    color: string
    degrees: number
    event: EventEmitter
    fatLevel: number
    id: string
    preventTrail: number
    scaleFactor: number
    speed: number
    turnRate: number
  }
}
