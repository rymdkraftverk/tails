import * as PIXI from 'pixi.js'
import * as l1 from 'l1'
import * as TextStyle from './util/textStyle'
import { GameColor } from './game'
import layer from './util/layer'
import { GAME_WIDTH } from './rendering'

const URL_POSITION_X = 100
const CODE_POSITION_X = 400
const POSITION_Y = 14

const LABEL_FONT_SIZE = 14
const TEXT_FONT_SIZE = 18

export const HeaderIds = {
  HEADER:            'header',
  HEADER_BACKGROUND: 'headerBackground',
  URL_LABEL:         'urlLabel',
  URL:               'url',
  CODE_LABEL:        'codeLabel',
  CODE:              'code',
}

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
      id:     HeaderIds.HEADER_BACKGROUND,
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

  const urlLabel = new PIXI.Text(
    'url: ',
    {
      ...TextStyle.SMALL,
      fontSize: LABEL_FONT_SIZE,
      fill:     'white',
    },
  )
  urlLabel.x = URL_POSITION_X
  urlLabel.y = POSITION_Y
  l1.add(urlLabel, {
    parent: container,
    id:     HeaderIds.URL_LABEL,
  })

  const urlText = new PIXI.Text(
    url,
    {
      ...TextStyle.CODE,
      fontSize: TEXT_FONT_SIZE,
      fill:     'white',
    },
  )
  urlText.x = URL_POSITION_X + urlLabel.width + 8
  urlText.y = POSITION_Y - 4
  l1.add(urlText, {
    parent: container,
    id:     HeaderIds.URL,
  })

  const codeLabel = new PIXI.Text(
    'code: ',
    {
      ...TextStyle.SMALL,
      fontSize: LABEL_FONT_SIZE,
      fill:     'white',
    },
  )
  codeLabel.x = CODE_POSITION_X
  codeLabel.y = POSITION_Y
  l1.add(codeLabel, {
    parent: container,
    id:     HeaderIds.CODE_LABEL,
  })

  const codeText = new PIXI.Text(
    code,
    {
      ...TextStyle.CODE,
      fontSize: TEXT_FONT_SIZE,
      fill:     'white',
    },
  )
  codeText.x = CODE_POSITION_X + codeLabel.width + 8
  codeText.y = POSITION_Y - 4
  l1.add(codeText, {
    parent: container,
    id:     HeaderIds.CODE,
  })
}
