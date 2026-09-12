import type * as PIXI from 'pixi.js'

export type PowerUpOptions = {
  player:          PIXI.Sprite
  players:         PIXI.Sprite[]
  snakeSpeed:      number
  speedMultiplier: number
}

export type PowerUpModule = {
  powerUp:           (options: PowerUpOptions) => void
  texture:           () => PIXI.Texture
  behaviorsToRemove: (player: PIXI.Sprite) => string[]
}
