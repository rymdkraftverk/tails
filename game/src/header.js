import * as PIXI from 'pixi.js'
import * as l1 from 'l1'
import * as TextStyle from './util/textStyle'
import { GameColor } from './game'
import layer from './util/layer'
import { GAME_WIDTH } from './rendering'

const URL_POSITION_X = 100
const CODE_POSITION_X = 600
const POSITION_Y = 10

export const HEADER_HEIGHT = 40

export default ({
  url,
  code,
}) => {
  const container = new PIXI.Container()
  l1.add(container, {
    id: 'header',
  })

  const background = new PIXI.Graphics()
  l1.add(
    background,
    {
      id:     'header-background',
      zIndex: layer.BACKGROUND + 10,
    },
  )

  background
    .beginFill(GameColor.BLUE)
    .moveTo(0, 0)
    .lineTo(GAME_WIDTH, 0)
    .lineTo(GAME_WIDTH, HEADER_HEIGHT)
    .lineTo(0, HEADER_HEIGHT)
    .lineTo(0, 0)
    .endFill()

  background.cacheAsBitmap = true

  const urlText = new PIXI.Text(
    `url: ${url}`,
    {
      ...TextStyle.CODE,
      fontSize: 16,
      fill:     'white',
    },
  )
  urlText.x = URL_POSITION_X
  urlText.y = POSITION_Y
  l1.add(urlText, {
    parent: container,
    id:     'urlText',
  })

  const codeText = new PIXI.Text(
    `code: ${code}`,
    {
      ...TextStyle.CODE,
      fontSize: 16,
      fill:     'white',
    },
  )
  codeText.x = CODE_POSITION_X
  codeText.y = POSITION_Y
  l1.add(codeText, {
    parent: container,
    id:     'codeText',
  })
}
