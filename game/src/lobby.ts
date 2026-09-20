import * as l2 from 'l2'
import * as PIXI from 'pixi.js'
import Bowser from 'bowser'
import { getUrlParams } from 'common'

import { MAX_PLAYERS_ALLOWED } from '.'
import * as bot from './bot'
import { GAME_WIDTH, GAME_HEIGHT } from './constant/rendering'
import * as TextStyle from './constant/textStyle'
import { GameColor, toRadians } from './game'
import { State, state } from './state'
import Layer from './constant/layer'
import bounce from './bounce'
import Scene from './Scene'
import getControllerUrl from './getControllerUrl'
import { playTrack } from 'l2/sound'
import Sound, { Track } from './constant/sound'
import delay from './delay'
import { showQrCode } from 'rkv-signaling/game'

const supportedBrowserNames = [
  'Chrome',
  'Firefox',
  'Safari',
]

const browser = Bowser.getParser(window.navigator.userAgent)
  .getBrowserName()

const isUnsupportedBrowser = !supportedBrowserNames.includes(browser)

const UNSUPPORTED_BROWSER_MESSAGE_LINE_1 = `${browser} is not`
const UNSUPPORTED_BROWSER_MESSAGE_LINE_2 = 'supported :('

const TEXT_BOUNCE_INTERVAL = 600

const TextAnchor = {
  TAILS_START_X:       92,
  TAILS_START_Y:       64,
  SUBHEADING_START_X:  280 + 250,
  SUBHEADING_START_Y:  40 + 30,
  INSTRUCTION_START_X: 92,
  INSTRUCTION_START_Y: 210,
  X_OFFSET:            80,
  Y_OFFSET:            150,
}

const BotButtons = {
  START_X:  390,
  SPACING:  270,
  Y:        620,
  OFFSET_X: 50,
  OFFSET_Y: 50,
}

const TextSize = {
  TAILS:       32,
  SUBHEADING:  40,
  INSTRUCTION: 50,
}

const TextColor = {
  TEXT:                'white',
  SUBHEADING:          '#44d800', // light green
  HIGHLIGHT:           '#04A4EC', // light blue
  UNSUPPORTED_BROWSER: '#ff5b5b', // light red
}

const QR_CODE_DARK = '#282828' // Same as background

const getPlayerPosition = l2.grid({
  x:           1000,
  y:           100,
  marginX:     170,
  marginY:     130,
  itemsPerRow: 2,
})

const addText = ({
  x,
  y,
  text,
  style,
  parent,
}: {
  x:       number
  y:       number
  text:    string
  style:   PIXI.TextStyle | Partial<PIXI.TextStyle>
  parent?: PIXI.Container
}) => {
  const textObject = new PIXI.Text({ text, style })

  textObject.x = x
  textObject.y = y

  l2.add(
    textObject,
    {
      parent,
    },
  )
  return textObject
}

export const transitionToLobby = (gameCode: string, players: Player[] = []) => {
  state.state = State.LOBBY

  const controllerUrl = getControllerUrl()
  const {
    subheading1: subheading1content,
    subheading2: subheading2content,
  } = getUrlParams(window.location.search)

  showQrCode({
    controllerHost: controllerUrl,
    gameCode,
    mount:          l2.getApp().canvas.parentElement as HTMLElement,
    dark:           QR_CODE_DARK,
  })

  const lobbyScene = new PIXI.Container()

  l2.add(
    lobbyScene,
    {
      id: Scene.LOBBY,
    },
  )

  const logo = new PIXI.Sprite(l2.getTexture('logo'))
  logo.y = 32
  l2.add(
    logo,
    {
      parent: lobbyScene,
    },
  )

  addText({
    x:     TextAnchor.TAILS_START_X,
    y:     TextAnchor.TAILS_START_Y,
    text:  'tails',
    style: {
      ...TextStyle.MEDIUM,
      fontSize: TextSize.TAILS,
      fill:     TextColor.TEXT,
    },
    parent: lobbyScene,
  })

  const subheading1 = addText({
    x:     TextAnchor.SUBHEADING_START_X,
    y:     TextAnchor.SUBHEADING_START_Y,
    text:  subheading1content || (isUnsupportedBrowser ? UNSUPPORTED_BROWSER_MESSAGE_LINE_1 : ''),
    style: {
      ...TextStyle.MEDIUM,
      fontSize: TextSize.SUBHEADING,
      fill:     isUnsupportedBrowser ? TextColor.UNSUPPORTED_BROWSER : TextColor.SUBHEADING,
    },
    parent: lobbyScene,
  })

  const subheading2 = addText({
    x:     TextAnchor.SUBHEADING_START_X,
    y:     TextAnchor.SUBHEADING_START_Y + 60,
    text:  subheading2content || (isUnsupportedBrowser ? UNSUPPORTED_BROWSER_MESSAGE_LINE_2 : ''),
    style: {
      ...TextStyle.MEDIUM,
      fontSize: TextSize.SUBHEADING,
      fill:     isUnsupportedBrowser ? TextColor.UNSUPPORTED_BROWSER : TextColor.SUBHEADING,
    },
    parent: lobbyScene,
  })

  subheading1.anchor.set(0.5)
  subheading2.anchor.set(0.5)

  // First bounce
  l2.addBehavior(textBounce(subheading1))
  l2.addBehavior(textBounce(subheading2))

  addText({
    x:     TextAnchor.INSTRUCTION_START_X,
    y:     TextAnchor.INSTRUCTION_START_Y,
    text:  'Grab your phone',
    style: {
      ...TextStyle.MEDIUM,
      fontSize: TextSize.INSTRUCTION,
      fill:     TextColor.TEXT,
    },
    parent: lobbyScene,
  })

  addText({
    x:     TextAnchor.INSTRUCTION_START_X + TextAnchor.X_OFFSET,
    y:     TextAnchor.INSTRUCTION_START_Y + TextAnchor.Y_OFFSET,
    text:  'Go to',
    style: {
      ...TextStyle.MEDIUM,
      fontSize: TextSize.INSTRUCTION,
      fill:     TextColor.TEXT,
    },
    parent: lobbyScene,
  })

  const url = addText({
    x:     TextAnchor.INSTRUCTION_START_X + TextAnchor.X_OFFSET + 420,
    y:     TextAnchor.INSTRUCTION_START_Y + (TextAnchor.Y_OFFSET + 22),
    text:  controllerUrl,
    style: {
      ...TextStyle.CODE,
      fontSize: 58,
      fill:
      TextColor.HIGHLIGHT,
    },
    parent: lobbyScene,
  })
  url.anchor.set(0.5)
  // Second bounce
  delay(TEXT_BOUNCE_INTERVAL / 3)
    .then(() => {
      l2.addBehavior(textBounce(url))
    })

  addText({
    x:     TextAnchor.INSTRUCTION_START_X + (TextAnchor.X_OFFSET * 2),
    y:     TextAnchor.INSTRUCTION_START_Y + (TextAnchor.Y_OFFSET * 2),
    text:  'Enter Code',
    style: {
      ...TextStyle.MEDIUM,
      fontSize: TextSize.INSTRUCTION,
      fill:     TextColor.TEXT,
    },
    parent: lobbyScene,
  })

  const code = addText({
    x:     TextAnchor.INSTRUCTION_START_X + ((TextAnchor.X_OFFSET * 2) + 480),
    y:     TextAnchor.INSTRUCTION_START_Y + ((TextAnchor.Y_OFFSET * 2) + 22),
    text:  gameCode,
    style: {
      ...TextStyle.CODE,
      fontSize:      58,
      padding:       10,
      letterSpacing: 3,
      fill:          TextColor.HIGHLIGHT,
    },
    parent: lobbyScene,
  })
  code.anchor.set(0.5)
  // Third bounce
  delay((TEXT_BOUNCE_INTERVAL / 3) * 2)
    .then(() => {
      l2.addBehavior(textBounce(code))
    })

  addText({
    x:     GAME_WIDTH - 175,
    y:     GAME_HEIGHT - 30,
    text:  '© Rymdkraftverk 2019',
    style: {
      fontSize:   16,
      fontFamily: 'helvetica',
      fill:       'white',
    },
    parent: lobbyScene,
  })

  const playersDivider = new PIXI.Graphics()
  l2.add(
    playersDivider,
    {
      id:     'playersDivider',
      parent: lobbyScene,
      zIndex: Layer.BACKGROUND + 10,
    },
  )

  playersDivider
    .moveTo(875, 0)
    .lineTo(875, GAME_HEIGHT)
    .stroke({ color: GameColor.WHITE, width: 4 })

  playersDivider.cacheAsTexture(true)

  drawInstructionArrow({
    x:      TextAnchor.INSTRUCTION_START_X + 320,
    y:      TextAnchor.INSTRUCTION_START_Y + ((TextAnchor.Y_OFFSET / 2) - 24),
    angle:  90,
    id:     '1',
    parent: lobbyScene,
  })

  drawInstructionArrow({
    x: TextAnchor.INSTRUCTION_START_X + 420,
    y: TextAnchor.INSTRUCTION_START_Y
      + TextAnchor.Y_OFFSET + ((TextAnchor.Y_OFFSET / 2) - 24),
    angle:  90,
    id:     '2',
    parent: lobbyScene,
  })

  Array
    .from({ length: MAX_PLAYERS_ALLOWED }, (_unused, index) => players[index])
    .forEach((player, index) => {
      if (player) {
        createLobbyPlayer(player, index, { newPlayer: false })
      }
      createOutline(index)
    })

  createBotButtons(lobbyScene)

  playTrack(Track.LOBBY)
}

const botButton = ({
  x, y, text, parent, onTap,
}: {
  x:      number
  y:      number
  text:   string
  parent: PIXI.Container
  onTap:  () => void
}) => {
  const button = addText({
    x,
    y,
    text,
    style: {
      ...TextStyle.SMALL,
      fill: TextColor.TEXT,
    },
    parent,
  })
  button.anchor.set(0.5)
  button.hitArea = new PIXI.Rectangle(
    -BotButtons.OFFSET_X / 2,
    -BotButtons.OFFSET_Y / 2,
    BotButtons.OFFSET_X,
    BotButtons.OFFSET_Y,
  )
  button.eventMode = 'static'
  button.cursor = 'pointer'
  button.on('pointerover', () => { button.style.fill = TextColor.HIGHLIGHT })
  button.on('pointerout', () => { button.style.fill = TextColor.TEXT })
  button.on('pointertap', onTap)
}

const createBotButtons = (parent: PIXI.Container) => {
  const kinds = [
    { kind: bot.BotKind.SPIRAL, label: 'spiral bots' },
    { kind: bot.BotKind.SMART, label: 'smart bots' },
  ]

  kinds.forEach(({ kind, label }, index) => {
    const x = BotButtons.START_X + (index * BotButtons.SPACING)

    addText({
      x,
      y:     BotButtons.Y,
      text:  label,
      style: {
        ...TextStyle.SMALL,
        fill: TextColor.SUBHEADING,
      },
      parent,
    }).anchor.set(0.5)

    botButton({
      x:     x - BotButtons.OFFSET_X,
      y:     BotButtons.Y + BotButtons.OFFSET_Y,
      text:  '-',
      parent,
      onTap: () => bot.remove(kind),
    })

    botButton({
      x:     x + BotButtons.OFFSET_X,
      y:     BotButtons.Y + BotButtons.OFFSET_Y,
      text:  '+',
      parent,
      onTap: () => bot.add(kind),
    })
  })
}

const drawInstructionArrow = ({
  x, y, id, angle, parent,
}: {
  x:       number
  y:       number
  id:      string
  angle:   number
  parent?: PIXI.Container
}) => {
  const instructionArrowOne = new PIXI.Sprite(l2.getTexture('expand-arrow-one'))
  l2.add(
    instructionArrowOne,
    {
      id: `instruction-arrow-${id}`,
      parent,
    },
  )

  instructionArrowOne.alpha = 0.2
  instructionArrowOne.x = x
  instructionArrowOne.y = y
  instructionArrowOne.scale.set(1)
  instructionArrowOne.rotation = toRadians(angle)
}

const createOutline = (index: number) => {
  const { x, y } = getPlayerPosition(index)

  const outline = new PIXI.Sprite(l2.getTexture('square-outline'))
  l2.add(
    outline,
    {
      id:     `outline-${index}`,
      parent: l2.get(Scene.LOBBY),
      zIndex: Layer.BACKGROUND + 10,
    },
  )

  outline.x = x
  outline.y = y
  outline.scale.set(1.5)
  outline.anchor.set(0.5)
}

export const createLobbyPlayer = (
  { color }: Player,
  playerIndex: number,
  { newPlayer }: { newPlayer: boolean },
) => {
  const { x, y } = getPlayerPosition(playerIndex)

  const square = new PIXI.Sprite(l2.getTexture(`square/square-${color}`))
  l2.add(
    square,
    {
      id:     `lobby-player-${color}`,
      labels: ['lobby-player'],
      parent: l2.get(Scene.LOBBY),
    },
  )

  square.x = x
  square.y = y
  square.scale.set(3)
  square.anchor.set(0.5)

  if (newPlayer) {
    l2.addBehavior(bounce(square, 0.08))
    const joinSounds = [
      Sound.JOIN1,
      Sound.JOIN2,
      Sound.JOIN3,
    ]
    const joinSound = joinSounds[l2.getRandomInRange(0, 3)]

    joinSound()
  }
}

const textBounce = (text: PIXI.Text) => ({
  duration:   TEXT_BOUNCE_INTERVAL,
  loop:       true,
  onComplete: () => {
    l2.addBehavior(bounce(text, 0.003))
    delay(20)
      .then(() => {
        l2.addBehavior(bounce(text, 0.003))
      })
  },
})
