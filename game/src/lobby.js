import * as l1 from 'l1'
import * as PIXI from 'pixi.js'
import _ from 'lodash/fp'
import R from 'ramda'
import Bowser from 'bowser'

import getUrlParams from 'common/getUrlParams'
import { MAX_PLAYERS_ALLOWED, onPlayerJoin } from '.'
import { GAME_WIDTH, GAME_HEIGHT } from './constant/rendering'
import * as TextStyle from './constant/textStyle'
import { GameColor, toRadians } from './game'
import { State, state } from './state'
import Layer from './constant/layer'
import bounce from './bounce'
import Scene from './Scene'
import getControllerUrl from './getControllerUrl'
import { Track, playTrack } from './music'
import Sound from './constant/sound'
import delay from './delay'
import * as qrCode from './qrCode'

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

const getPlayerPosition = l1.grid({
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
}) => {
  const textObject = new PIXI.Text(
    text,
    style,
  )

  textObject.x = x
  textObject.y = y

  l1.add(
    textObject,
    {
      parent,
    },
  )
  return textObject
}

export const transitionToLobby = (gameCode, players = []) => {
  state.state = State.LOBBY

  const controllerUrl = getControllerUrl()
  const {
    subheading1: subheading1content,
    subheading2: subheading2content,
  } = getUrlParams(window.location.search)

  qrCode.display(controllerUrl, gameCode)

  const lobbyScene = new PIXI.Container()

  l1.add(
    lobbyScene,
    {
      id: Scene.LOBBY,
    },
  )

  const logo = new PIXI.Sprite(l1.getTexture('logo'))
  logo.y = 32
  l1.add(
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
  l1.addBehavior(textBounce(subheading1))
  l1.addBehavior(textBounce(subheading2))

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
      l1.addBehavior(textBounce(url))
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
  delay(TEXT_BOUNCE_INTERVAL / 3 * 2)
    .then(() => {
      l1.addBehavior(textBounce(code))
    })

  addText({
    x:     GAME_WIDTH - 175,
    y:     GAME_HEIGHT - 30,
    text:  '© Rymdkraftverk 2019',
    style: {
      fontSize:   16,
      fontfamily: 'helvetica',
      fill:       'white',
    },
    parent: lobbyScene,
  })

  const playersDivider = new PIXI.Graphics()
  l1.add(
    playersDivider,
    {
      id:     'playersDivider',
      parent: lobbyScene,
      zIndex: Layer.BACKGROUND + 10,
    },
  )

  playersDivider
    .lineStyle(4, GameColor.WHITE, 1)
    .moveTo(875, 0)
    .lineTo(875, GAME_HEIGHT)

  playersDivider.cacheAsBitmap = true

  drawInstructionArrow({
    x:            TextAnchor.INSTRUCTION_START_X + 320,
    y:            TextAnchor.INSTRUCTION_START_Y + ((TextAnchor.Y_OFFSET / 2) - 24),
    angle:        90,
    id:           '1',
    parentEntity: lobbyScene,
  })

  drawInstructionArrow({
    x: TextAnchor.INSTRUCTION_START_X + 420,
    y: TextAnchor.INSTRUCTION_START_Y
      + TextAnchor.Y_OFFSET + ((TextAnchor.Y_OFFSET / 2) - 24),
    angle:        90,
    id:           '2',
    parentEntity: lobbyScene,
  })

  _
    .times(index => players[index], MAX_PLAYERS_ALLOWED)
    .forEach((player, index) => {
      if (player) {
        createLobbyPlayer(player, index, { newPlayer: false })
      }
      createOutline(index)
    })

  playTrack(Track.LOBBY, { loop: true })
}

const drawInstructionArrow = ({
  x, y, id, angle, parent,
}) => {
  const instructionArrowOne = new PIXI.Sprite(l1.getTexture('expand-arrow-one'))
  l1.add(
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

  instructionArrowOne.cacheAsBitmap = true
}

const createOutline = (index) => {
  const { x, y } = getPlayerPosition(index)

  const outline = new PIXI.Sprite(l1.getTexture('square-outline'))
  l1.add(
    outline,
    {
      id:     `outline-${index}`,
      parent: l1.get(Scene.LOBBY),
      zIndex: Layer.BACKGROUND + 10,
    },
  )

  outline.x = x
  outline.y = y
  outline.scale.set(1.5)
  outline.anchor.set(0.5)
}

export const createLobbyPlayer = ({ color }, playerIndex, { newPlayer }) => {
  const { x, y } = getPlayerPosition(playerIndex)

  const square = new PIXI.Sprite(l1.getTexture(`square/square-${color}`))
  l1.add(
    square,
    {
      id:     `lobby-player-${color}`,
      labels: ['lobby-player'],
      parent: l1.get(Scene.LOBBY),
    },
  )

  square.x = x
  square.y = y
  square.scale.set(3)
  square.anchor.set(0.5)

  if (newPlayer) {
    l1.addBehavior(bounce(square, 0.08))
    const joinSounds = [
      Sound.JOIN1,
      Sound.JOIN2,
      Sound.JOIN3,
    ]
    const joinSound = joinSounds[l1.getRandomInRange(0, 3)]

    l1.sound({
      src:    joinSound,
      volume: 0.4,
    })
  }
}

const addMockPlayer = (idPrefix = 'debugPlayer:') => onPlayerJoin({
  id: `${idPrefix}${Math.random()
    .toString(36)
    .substring(7)}`,
  close:     () => {},
  send:      () => {},
  setOnData: () => {},
})

window.debug = {
  ...window.debug,
  addMockPlayers: count => R.range(0, count)
    .map(() => addMockPlayer()),
  addSpiralMockPlayers: count => R.range(0, count)
    .map(() => addMockPlayer('debugSpiralPlayer:')),
}

const textBounce = text => ({
  duration:   TEXT_BOUNCE_INTERVAL,
  loop:       true,
  onComplete: () => {
    l1.addBehavior(bounce(text, 0.003))
    delay(20)
      .then(() => {
        l1.addBehavior(bounce(text, 0.003))
      })
  },
})
