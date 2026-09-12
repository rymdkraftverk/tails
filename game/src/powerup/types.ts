import type * as PIXI from 'pixi.js'

export type PowerUpOptions = {
  player:          PIXI.Container
  players:         PIXI.Container[]
  snakeSpeed:      number
  speedMultiplier: number
}

export type PowerUpModule = {
  powerUp:           (options: PowerUpOptions) => void
  texture:           () => PIXI.Texture
  behaviorsToRemove: (player: PIXI.Container) => string[]
}
