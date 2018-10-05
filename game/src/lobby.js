import l1 from 'l1'
import _ from 'lodash/fp'
import R from 'ramda'
import { MAX_PLAYERS_ALLOWED, onControllerJoin } from '.'
import { GAME_WIDTH, GAME_HEIGHT } from './rendering'
import * as TextStyle from './util/textStyle'
import { GameColor, toRadians } from './game'
import gameState, { CurrentState } from './gameState'
import Layer from './util/layer'
import bounce from './bounce'
import Scene from './Scene'
import { Track, playTrack } from './music'

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

const getPlayerPosition = l1.grid({
  x:           1000,
  y:           100,
  marginX:     170,
  marginY:     130,
  itemsPerRow: 2,
})

export const transitionToLobby = (gameCode, alreadyConnectedPlayers = []) => {
  gameState.currentState = CurrentState.LOBBY
  const lobbyScene = l1.container({
    id: Scene.LOBBY,
  })

  l1.text({
    text:  'Grab your phone',
    style: {
      ...TextStyle.MEDIUM,
      fontSize: 50,
      fill:     TextColor.TEXT,
    },
    parent: lobbyScene,
  }).asset.position.set(
    TextAnchor.INSTRUCTION_START_X,
    100,
  )

  l1.text({
    text:  'Go to',
    style: {
      ...TextStyle.MEDIUM,
      fontSize: 50,
      fill:     TextColor.TEXT,
    },
    parent: lobbyScene,
  }).asset.position.set(
    TextAnchor.INSTRUCTION_START_X,
    300,
  )

  l1.text({
    text:  getControllerUrl(),
    style: {
      ...TextStyle.CODE,
      fontSize: 58,
      fill:
      TextColor.HIGHLIGHT,
    },
    parent: lobbyScene,
  }).asset.position.set(
    TextAnchor.INSTRUCTION_START_X + 210,
    292,
  )


  l1.text({
    text:  'Enter Code',
    style: {
      ...TextStyle.MEDIUM,
      fontSize: 50,
      fill:     TextColor.TEXT,
    },
    parent: lobbyScene,
  }).asset.position.set(
    TextAnchor.INSTRUCTION_START_X,
    520,
  )

  l1.text({
    text:  gameCode,
    style: {
      ...TextStyle.CODE,
      fontSize:      58,
      padding:       10,
      letterSpacing: 3,
      fill:          TextColor.HIGHLIGHT,
    },
    parent: lobbyScene,
  }).asset.position.set(
    TextAnchor.INSTRUCTION_START_X + 400,
    514,
  )

  l1.text({
    text:  '© Rymdkraftverk 2018',
    style: {
      ...TextStyle.CODE,
      fontSize: 18,
    },
    parent: lobbyScene,
  }).asset.position.set(
    GAME_WIDTH - 300,
    GAME_HEIGHT - 40,
  )

  const titleBackground = l1.graphics({
    parent: lobbyScene,
    zIndex: Layer.BACKGROUND + 10,
  })

  titleBackground.asset
    .beginFill(GameColor.BLUE)
    .moveTo(0, 0)
    .lineTo(GAME_WIDTH, 0)
    .lineTo(GAME_WIDTH, TITLE_BACKGROUND_HEIGHT)
    .lineTo(0, TITLE_BACKGROUND_HEIGHT)
    .lineTo(0, 0)
    .endFill()

  const playersDivider = l1.graphics({
    parent: lobbyScene,
    zIndex: Layer.BACKGROUND + 10,
  })

  playersDivider.asset
    .lineStyle(4, GameColor.WHITE, 1)
    .moveTo(875, TITLE_BACKGROUND_HEIGHT + 15)
    .lineTo(875, 700)

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

  playTrack(Track.LOBBY, { loop: true })
}

const drawInstructionArrow = ({
  x, y, id, angle, parent,
}) => {
  const instructionArrowOne = l1.sprite({
    id:      `instruction-arrow-${id}`,
    texture: 'expand-arrow-one',
    parent,
  })

  instructionArrowOne.asset.x = x
  instructionArrowOne.asset.y = y
  instructionArrowOne.asset.scale.set(1)
  instructionArrowOne.asset.rotation = toRadians(angle)
}

const createOutline = (index) => {
  const { x, y } = getPlayerPosition(index)

  const outline = l1.sprite({
    id:      `outline-${index}`,
    parent:  l1.get(Scene.LOBBY),
    texture: 'square-outline',
    zIndex:  Layer.BACKGROUND + 10,
  })

  outline.asset.x = x
  outline.asset.y = y
  outline.asset.scale.set(1.5)
  outline.asset.anchor.set(0.5)
}

export const createPlayerEntity = ({ color }, playerIndex, { newPlayer }) => {
  const { x, y } = getPlayerPosition(playerIndex)

  const square = l1.sprite({
    id:      `square-${color}`,
    types:   ['lobby-square'],
    parent:  l1.get(Scene.LOBBY),
    texture: `square-${color}`,
  })

  square.asset.x = x
  square.asset.y = y
  square.asset.scale.set(3)
  square.asset.anchor.set(0.5)

  if (newPlayer) {
    l1.addBehavior(
      square,
      bounce(0.08),
    )
    const joinSounds = [
      'join1',
      'join2',
      'join3',
    ]
    const joinSound = joinSounds[l1.getRandomInRange(0, 3)]

    l1.sound({
      src:    `./sounds/${joinSound}.wav`,
      volume: 0.6,
    })
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
