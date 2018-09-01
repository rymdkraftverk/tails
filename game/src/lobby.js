import { Entity, Sound, Util, Sprite, Text, Graphics } from 'l1'
import _ from 'lodash/fp'
import R from 'ramda'
import { MAX_PLAYERS_ALLOWED, onControllerJoin } from '.'
import { GAME_WIDTH, GAME_HEIGHT } from './rendering'
import { code, medium } from './util/textStyles'
import { GameColor, toRadians } from './game'
import gameState from './gameState'
import layers from './util/layers'
import bounce from './bounce'
import Scene from './Scene'

const CONTROLLER_PORT = '4001'
const TextAnchor = {
  INSTRUCTION_START_X: 64,
}

const TextColor = {
  TEXT:      'white',
  HIGHLIGHT: '#04A4EC',
}

const TITLE_BACKGROUND_HEIGHT = 40

const deployedURLs = {
  'game.rymdkraftverk.com': 'rymdkraftverk.com',
}

const getControllerUrl = () => {
  const {
    location: {
      hostname,
      port,
    },
  } = window

  return port ? `${hostname}:${CONTROLLER_PORT}` : deployedURLs[hostname]
}

const getPlayerPosition = Util.grid({
  x:           1000,
  y:           100,
  marginX:     170,
  marginY:     130,
  itemsPerRow: 2,
})

export const transitionToLobby = (gameCode, alreadyConnectedPlayers = []) => {
  gameState.playingRound = false
  const lobbyScene = Entity
    .addChild(
      Entity.getRoot(),
      {
        id: Scene.LOBBY,
      },
    )

  createText({
    x:      TextAnchor.INSTRUCTION_START_X,
    y:      100,
    text:   'Grab your phone',
    style:  { ...medium, fontSize: 50, fill: TextColor.TEXT },
    parent: lobbyScene,
  })

  createText({
    x:      TextAnchor.INSTRUCTION_START_X,
    y:      300,
    text:   'Go to',
    style:  { ...medium, fontSize: 50, fill: TextColor.TEXT },
    parent: lobbyScene,
  })

  createText({
    x:      TextAnchor.INSTRUCTION_START_X + 210,
    y:      292,
    text:   getControllerUrl(),
    style:  { ...code, fontSize: 58, fill: TextColor.HIGHLIGHT },
    parent: lobbyScene,
  })

  createText({
    x:      TextAnchor.INSTRUCTION_START_X,
    y:      520,
    text:   'Enter Code',
    style:  { ...medium, fontSize: 50, fill: TextColor.TEXT },
    parent: lobbyScene,
  })

  createText({
    x:     TextAnchor.INSTRUCTION_START_X + 400,
    y:     514,
    text:  gameCode,
    style: {
      ...code,
      fontSize:      58,
      padding:       10,
      letterSpacing: 3,
      fill:          TextColor.HIGHLIGHT,
    },
    parent: lobbyScene,
  })

  createText({
    x:     GAME_WIDTH - 300,
    y:     GAME_HEIGHT - 40,
    text:  '© Rymdkraftverk 2018',
    style: {
      ...code,
      fontSize: 18,
    },
    parent: lobbyScene,
  })

  const titleBackground = Entity.addChild(lobbyScene)
  const titleBackgroundGraphics = Graphics
    .create(titleBackground, { zIndex: layers.BACKGROUND + 10 })

  titleBackgroundGraphics.beginFill(GameColor.BLUE)
  titleBackgroundGraphics.moveTo(0, 0)
  titleBackgroundGraphics.lineTo(GAME_WIDTH, 0)
  titleBackgroundGraphics.lineTo(GAME_WIDTH, TITLE_BACKGROUND_HEIGHT)
  titleBackgroundGraphics.lineTo(0, TITLE_BACKGROUND_HEIGHT)
  titleBackgroundGraphics.lineTo(0, 0)
  titleBackgroundGraphics.endFill()

  const playersDivider = Entity.addChild(lobbyScene)
  const playersDividerGraphics = Graphics
    .create(playersDivider, { zIndex: layers.BACKGROUND + 10 })

  playersDividerGraphics.lineStyle(4, GameColor.WHITE, 1)
  playersDividerGraphics.moveTo(875, TITLE_BACKGROUND_HEIGHT + 15)
  playersDividerGraphics.lineTo(875, 700)

  drawInstructionArrow({
    x:            400,
    y:            170,
    angle:        90,
    id:           '1',
    parentEntity: lobbyScene,
  })

  drawInstructionArrow({
    x:            400,
    y:            400,
    angle:        90,
    id:           '2',
    parentEntity: lobbyScene,
  })

  drawInstructionArrow({
    x:            700,
    y:            500,
    angle:        0,
    id:           '3',
    parentEntity: lobbyScene,
  })

  _
    .times(index => alreadyConnectedPlayers[index], MAX_PLAYERS_ALLOWED)
    .forEach((player, index) => {
      if (player) {
        createPlayerEntity(player, index, { newPlayer: false })
      }
      createOutline(index)
    })
}

const drawInstructionArrow = ({
  x, y, id, angle, parentEntity,
}) => {
  const instructionArrowOne = Entity
    .addChild(
      parentEntity,
      {
        id: `instruction-arrow-${id}`,
        x,
        y,
      },
    )

  const instructionArrowOneSprite = Sprite
    .show(
      instructionArrowOne,
      {
        texture: 'expand-arrow-one',
      },
    )

  instructionArrowOneSprite.scale.set(1)
  instructionArrowOneSprite.rotation = toRadians(angle)
}

const createOutline = (index) => {
  const { x, y } = getPlayerPosition(index)

  const e = Entity.addChild(
    Entity.get(Scene.LOBBY),
    {
      id: `outline-${index}`,
      x,
      y,
    },
  )
  const sprite = Sprite.show(e, {
    texture: 'square-outline',
    zIndex:  layers.BACKGROUND + 10,
  })
  sprite.scale.set(1.5)
  sprite.anchor.set(0.5)
}

const createText = ({
  x, y, text, style, parent,
}) => {
  const textEntity = Entity.addChild(
    parent,
    {
      x,
      y,
    },
  )

  Text.show(
    textEntity,
    {
      text,
      style,
    },
  )
}

export const createPlayerEntity = ({ color }, playerIndex, { newPlayer }) => {
  const { x, y } = getPlayerPosition(playerIndex)

  const square = Entity.addChild(
    Entity.get(Scene.LOBBY),
    {
      id:    `square-${color}`,
      x,
      y,
      types: ['lobby-square'],
    },
  )
  const sprite = Sprite.show(square, { texture: `square-${color}` })
  sprite.scale.set(3)
  sprite.anchor.set(0.5)

  if (newPlayer) {
    square.behaviors.bounce = bounce()
    const joinSounds = [
      'join1',
      'join2',
      'join3',
    ]
    const joinSound = joinSounds[Util.getRandomInRange(0, 3)]

    const sound = Entity.addChild(square)
    Sound.play(sound, { src: `./sounds/${joinSound}.wav`, volume: 0.6 })
  }
}

const addMockPlayer = () => onControllerJoin({
  id: `debugPlayer:${Math.random()
    .toString(36)
    .substring(7)}`,
  close: () => {},
})

window.debug = {
  ...window.debug,
  addMockPlayers: count => R.range(0, count)
    .map(() => addMockPlayer()),
}
