import type * as PIXI from 'pixi.js'

export interface PowerUpOptions {
  player:          PIXI.Sprite;
  players:         PIXI.Sprite[];
  snakeSpeed:      number;
  speedMultiplier: number;
}

export interface PowerUpModule {
  powerUp:           (options: PowerUpOptions) => void;
  texture:           () => PIXI.Texture;
  behaviorsToRemove: (player: PIXI.Sprite) => string[];
}
