declare module 'l1' {
  import type * as PIXI from 'pixi.js'
  import type { Howl } from 'howler'

  type Point = { x: number; y: number }

  type BehaviorData = Record<string, any>

  type Behavior = {
    counter: number
    data: BehaviorData
    duration: number
    enabled: boolean
    finished: boolean
    id: string
    labels: string[]
    loop: boolean
    onComplete?: ((behavior: Behavior) => void) | null
    onInit?: ((behavior: Behavior) => void) | null
    onRemove?: ((behavior: Behavior) => void) | null
    onUpdate?: ((behavior: Behavior) => void) | null
    removeOnComplete: boolean
  }

  type BehaviorOptions = {
    data?: BehaviorData
    duration?: number
    enabled?: boolean
    id?: string
    labels?: string[]
    loop?: boolean
    onComplete?: (behavior: Behavior) => void
    onInit?: (behavior: Behavior) => void
    onRemove?: (behavior: Behavior) => void
    onUpdate?: (behavior: Behavior) => void
    removeOnComplete?: boolean
  }

  export function init(app: PIXI.Application, options?: object): void
  export function add<T extends PIXI.DisplayObject>(
    displayObject: T,
    options?: { parent?: PIXI.Container; zIndex?: number; id?: string; labels?: string[] },
  ): T
  export function get(id: string): PIXI.Container | undefined
  export function getAll(): PIXI.Container[]
  // Everything the game labels is a sprite, and callers rely on that
  export function getByLabel(label: string): PIXI.Sprite[]
  export function destroy(displayObject: PIXI.DisplayObject | string, options?: { children?: boolean }): void
  export function addBehavior(behavior: BehaviorOptions): Behavior
  export function removeBehavior(behavior: Behavior | string): void
  export function getBehavior(id: string): Behavior | undefined
  export function getAllBehaviors(): Behavior[]
  export function getTexture(filename: string): PIXI.Texture
  export function getRandomInRange(from: number, to: number): number
  export function sound(options: { src: string; volume?: number; loop?: boolean }): Howl
  export function getScale(): number
  export function isColliding(a: PIXI.DisplayObject, b: PIXI.DisplayObject): boolean
  export function getGlobalPosition(displayObject: PIXI.DisplayObject): Point
  export function toRadians(angle: number): number
  export function resize(width: number, height: number): void
  export function grid(options: {
    x: number
    y: number
    marginX: number
    marginY: number
    itemsPerRow: number
  }): (index: number) => Point
  export function getLoopDuration(): number

  export { type Behavior, type BehaviorOptions }
}
