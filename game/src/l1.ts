import { Howl } from 'howler'
import * as PIXI from 'pixi.js'

type Point = { x: number, y: number }

export type Behavior<Data = never> = {
  counter:   number
  data:      Data
  deltaTime: number
}

export type BehaviorOptions<Data = never> = {
  data?:             Data
  duration?:         number
  enabled?:          boolean
  id?:               string
  labels?:           string[]
  loop?:             boolean
  onComplete?:       (behavior: Behavior<Data>) => void
  onInit?:           (behavior: Behavior<Data>) => void
  onRemove?:         (behavior: Behavior<Data>) => void
  onUpdate?:         (behavior: Behavior<Data>) => void
  removeOnComplete?: boolean
}

export type BehaviorRecord = {
  counter:           number
  data:              unknown
  duration:          number
  enabled:           boolean
  finished:          boolean
  id:                string
  initHasBeenCalled: boolean
  labels:            string[]
  loop:              boolean
  onComplete:        ((behavior: Behavior) => void) | null
  onInit:            ((behavior: Behavior) => void) | null
  onRemove:          ((behavior: Behavior) => void) | null
  onUpdate:          ((behavior: Behavior) => void) | null
  removeOnComplete:  boolean
}

type AddOptions = {
  parent?: PIXI.Container
  zIndex?: number | null
  id?:     string
  labels?: string[]
}

const displayObjects: PIXI.Container[] = []
const behaviors: BehaviorRecord[] = []

const counters = {
  displayObject: 0,
  behavior:      0,
}

const registry = {
  app:              null as unknown as PIXI.Application,
  spritesheets:     [] as PIXI.Spritesheet[],
  ratio:            1,
  gameWidth:        0,
  gameHeight:       0,
  lastLoopDuration: 0,
  logging:          false,
}

const log = (text: string) => {
  if (registry.logging) {
    console.warn(text)
  }
}

export const updateRenderLayers = (displayObject: PIXI.Container) => {
  displayObject.children.sort((a, b) => {
    a.l1.zIndex = a.l1.zIndex || 0
    b.l1.zIndex = b.l1.zIndex || 0
    return a.l1.zIndex - b.l1.zIndex
  })
}

export const add = (displayObject: PIXI.Container, options: AddOptions = {}) => {
  const {
    parent = registry.app.stage,
    zIndex = null,
    id = `do-${(counters.displayObject += 1)}`,
    labels = [],
  } = options

  parent.addChild(displayObject)
  displayObjects.push(displayObject)

  displayObject.l1 = {
    id,
    zIndex,
    labels,
    isDestroyed: () => !displayObject.parent,
  }

  displayObject.label = id

  /*
    This is done to counteract a potential scale change on the canvas. Since changing the scale
    of a text object will make it blurry.

    This can be removed when Pixi makes it possible to scale text objects.
  */
  if (displayObject instanceof PIXI.Text) {
    displayObject.l1.originalSize = Number(displayObject.style.fontSize)
    displayObject.style.fontSize = Number(displayObject.style.fontSize) * registry.ratio
    displayObject.scale.set(1 / registry.ratio)
  }

  if (zIndex !== null) {
    updateRenderLayers(parent)
  }
}

export const get = (id: string) => displayObjects
  .find(displayObject => displayObject.l1.id === id)

export const getAll = () => displayObjects

export const getByLabel = (label: string) => displayObjects
  .filter(displayObject => displayObject.l1.labels.includes(label)) as PIXI.Sprite[]

const forget = (displayObject: PIXI.Container) => {
  // Mutate original array for performance reasons
  const indexToForget = displayObjects.indexOf(displayObject)
  if (indexToForget >= 0) {
    displayObjects.splice(indexToForget, 1)
  }
}

export const getBehavior = (id: string) => behaviors.find(behavior => behavior.id === id)

export const getAllBehaviors = () => behaviors.slice()

export const removeBehavior = (behavior: { id: string } | string) => {
  const id = typeof behavior === 'string' ? behavior : behavior.id
  const behaviorObject = getBehavior(id)

  if (!behaviorObject) {
    log(`level1: Tried to remove non-existent behavior: ${behavior}`)
    return
  }

  const indexToRemove = behaviors.indexOf(behaviorObject)
  if (indexToRemove >= 0) {
    behaviors.splice(indexToRemove, 1)
  }

  behaviorObject.enabled = false

  if (behaviorObject.onRemove) {
    behaviorObject.onRemove(toBehavior(behaviorObject, 0))
  }
}

export const resetBehavior = (behavior: BehaviorRecord) => {
  behavior.counter = 0
  behavior.finished = false
}

const toBehavior = (behavior: BehaviorRecord, deltaTime: number) => ({
  counter: behavior.counter,
  data:    behavior.data,
  deltaTime,
} as Behavior)

export const addBehavior = <Data>(options: BehaviorOptions<Data>) => {
  const {
    id = `behavior-${(counters.behavior += 1)}`,
    labels = [],
    duration = 0,
    loop = false,
    removeOnComplete = true,
    onUpdate = null,
    onComplete = null,
    onInit = null,
    onRemove = null,
    enabled = true,
    data,
  } = options

  if (getBehavior(id)) {
    log(`level1: Behavior with id ${id} already exists`)
    removeBehavior(id)
  }

  if (!duration && onComplete) {
    log(`level1: behavior "${id}" has an onComplete callback but no duration`)
  }

  const behavior: BehaviorRecord = {
    counter:           0,
    data,
    duration:          Math.round(duration),
    enabled,
    finished:          false,
    id,
    initHasBeenCalled: false,
    labels,
    loop,
    onComplete:        onComplete,
    onInit:            onInit,
    onRemove:          onRemove,
    onUpdate:          onUpdate,
    removeOnComplete,
  }

  behaviors.push(behavior)
  return behavior
}

const update = (onError: (error: Error) => void) => (deltaTime: number) => {
  try {
    const before = performance.now()

    behaviors
      .slice()
      .forEach((behavior) => {
        if (!behavior.enabled) {
          return
        }

        if (!behavior.initHasBeenCalled) {
          if (behavior.onInit) {
            behavior.onInit(toBehavior(behavior, deltaTime))
          }
          behavior.initHasBeenCalled = true
        }

        if (behavior.onUpdate) {
          behavior.onUpdate(toBehavior(behavior, deltaTime))
        }

        if (behavior.duration > 0 && behavior.counter === behavior.duration && !behavior.finished) {
          behavior.finished = true

          if (behavior.onComplete) {
            behavior.onComplete(toBehavior(behavior, deltaTime))
          }

          if (behavior.loop) {
            resetBehavior(behavior)
          } else if (behavior.removeOnComplete && behavior.enabled) {
            removeBehavior(behavior)
          }
        }

        behavior.counter += 1
      })

    registry.lastLoopDuration = performance.now() - before
  } catch (error) {
    console.error('l1: Error running behaviors', error)
    onError(error as Error)
  }
}

export const init = (
  app: PIXI.Application,
  options: { logging?: boolean, onError?: (error: Error) => void } = {},
) => {
  const { logging = false, onError = () => {} } = options

  const tick = update(onError)
  app.ticker.add((ticker) => {
    tick(ticker.deltaTime)
  })

  registry.app = app
  registry.gameWidth = app.renderer.width
  registry.gameHeight = app.renderer.height
  registry.logging = logging
}

export const useSpritesheets = (sheets: PIXI.Spritesheet[]) => {
  registry.spritesheets = sheets
}

export const getTexture = (filename: string) => {
  const texture = registry
    .spritesheets
    .map(sheet => sheet.textures[`${filename}.png`])
    .find(Boolean)

  if (!texture) {
    throw new Error(`level1: Texture "${filename}" not found.`)
  }

  return texture
}

export const resize = (width: number, height: number) => {
  registry.ratio = Math.min(
    width / registry.gameWidth,
    height / registry.gameHeight,
  )

  registry.app.stage.scale.set(registry.ratio)

  registry.app.renderer.resize(
    registry.gameWidth * registry.ratio,
    registry.gameHeight * registry.ratio,
  )

  /*
    The following code is needed to counteract the scale change on the whole canvas since
    texts get distorted by PIXI when you try to change their scale.
    Texts instead change size by setting their fontSize.
  */
  displayObjects
    .forEach((displayObject) => {
      if (displayObject instanceof PIXI.Text && displayObject.l1.originalSize) {
        displayObject.style.fontSize = displayObject.l1.originalSize * registry.ratio
        displayObject.scale.set(1 / registry.ratio)
      }
    })
}

const getManagedDescendants = (displayObject: PIXI.Container): PIXI.Container[] => {
  const fromChildren = displayObject
    .children
    .flatMap(child => getManagedDescendants(child))

  return displayObject.l1 ? fromChildren.concat(displayObject) : fromChildren
}

export const destroy = (
  displayObject: PIXI.Container | string,
  options: { children?: boolean } = { children: true },
) => {
  const target = typeof displayObject === 'string'
    ? get(displayObject)
    : displayObject

  if (!target) {
    log(`level1: Tried to remove non-existent displayObject: ${displayObject}`)
    return
  }

  if (!target.parent) {
    log(`level1: ${target.l1?.id} has already been destroyed`)
    return
  }

  if (target.l1) {
    if (options.children) {
      getManagedDescendants(target)
.forEach(forget)
    } else {
      forget(target)
    }
  }

  target.parent.removeChild(target)
  target.destroy(options)
}

export const toRadians = (angle: number) => angle * (Math.PI / 180)

export const grid = ({ x, y, marginX, marginY, itemsPerRow }: {
  x:           number
  y:           number
  marginX:     number
  marginY:     number
  itemsPerRow: number
}) => (index: number) => ({
  x: x + ((index % itemsPerRow) * marginX),
  y: y + (Math.floor(index / itemsPerRow) * marginY),
})

export const getRandomInRange = (from: number, to: number) => Math
  .floor((Math.random() * (to - from)) + from)

export const getScale = () => registry.ratio

export const getGlobalPosition = (displayObject: PIXI.Container): Point => {
  const global = displayObject.toGlobal(new PIXI.Point(0, 0))

  return {
    x: global.x / registry.ratio,
    y: global.y / registry.ratio,
  }
}

const getWidth = (displayObject: PIXI.Container) => {
  const hitArea = displayObject.hitArea as PIXI.Rectangle | null
  return (hitArea && hitArea.width) || (displayObject).width
}

const getHeight = (displayObject: PIXI.Container) => {
  const hitArea = displayObject.hitArea as PIXI.Rectangle | null
  return (hitArea && hitArea.height) || (displayObject).height
}

export const isColliding = (
  displayObject: PIXI.Container,
  otherDisplayObject: PIXI.Container,
) => {
  const { x, y } = getGlobalPosition(displayObject)
  const width = getWidth(displayObject)
  const height = getHeight(displayObject)

  const { x: otherX, y: otherY } = getGlobalPosition(otherDisplayObject)
  const otherWidth = getWidth(otherDisplayObject)
  const otherHeight = getHeight(otherDisplayObject)

  return x + width >= otherX
    && otherX + otherWidth >= x
    && y + height >= otherY
    && otherY + otherHeight >= y
}

/*
  Check Howler docs for available options
*/
export const sound = ({ src, volume, loop }: {
  src:     string
  volume?: number
  loop?:   boolean
}) => {
  const howl = new Howl({ src: [src], volume, loop })
  howl.play()
  return howl
}

export const getLoopDuration = () => registry.lastLoopDuration
