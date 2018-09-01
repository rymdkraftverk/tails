import { Entity, Sound, Util, Sprite, Text, Graphics } from 'l1'
import _ from 'lodash/fp'
import R from 'ramda'
import { GAME_WIDTH, GAME_HEIGHT, MAX_PLAYERS_ALLOWED, onControllerJoin } from '.'
import * as TextStyle from './util/TextStyle'
import { GameColor } from './game'
import Layer from './util/Layer'
import bounce from './bounce'
import Scene from './util/Scene'

const CONTROLLER_PORT = '4001'

const TITLE_BACKGROUND_HEIGHT = 120

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
  x:           480,
  y:           400,
  marginX:     150,
  marginY:     150,
  itemsPerRow: 5,
})

export const transitionToLobby = (gameCode, alreadyConnectedPlayers = []) => {
  const lobbyScene = Entity
    .addChild(
      Entity.getRoot(),
      {
        id: Scene.LOBBY,
      },
    )

  createText({
    x:     50,
    y:     30,
    text:  'LOBBY',
    style: {
      ...TextStyle.BIG,
      fill: 'white',
    },
    parent: lobbyScene,
  })

  createText({
    x:     50,
    y:     340,
    text:  'Go to:',
    style: {
      ...TextStyle.SMALL,
      fill: 'white',
    },
    parent: lobbyScene,
  })

  createText({
    x:     50,
    y:     370,
    text:  getControllerUrl(),
    style: {
      ...TextStyle.CODE,
      fontSize: 30,
    },
    parent: lobbyScene,
  })


  createText({
    x:     50,
    y:     480,
    text:  'Code:',
    style: {
      ...TextStyle.SMALL,
      fill: 'white',
    },
    parent: lobbyScene,
  })

  createText({
    x:      50,
    y:      520,
    text:   gameCode,
    style:  TextStyle.CODE,
    parent: lobbyScene,
  })

  createText({
    x:     GAME_WIDTH - 230,
    y:     GAME_HEIGHT - 48,
    text:  '© Rymdkraftverk 2018',
    style: {
      ...TextStyle.CODE,
      fontSize: 20,
    },
    parent: lobbyScene,
  })

  const titleBackground = Entity.addChild(lobbyScene)
  const titleBackgroundGraphics = Graphics
    .create(titleBackground, { zIndex: Layer.BACKGROUND + 10 })

  titleBackgroundGraphics.beginFill(GameColor.BLUE)
  titleBackgroundGraphics.moveTo(0, 0)
  titleBackgroundGraphics.lineTo(GAME_WIDTH, 0)
  titleBackgroundGraphics.lineTo(GAME_WIDTH, TITLE_BACKGROUND_HEIGHT)
  titleBackgroundGraphics.lineTo(0, TITLE_BACKGROUND_HEIGHT)
  titleBackgroundGraphics.lineTo(0, 0)
  titleBackgroundGraphics.endFill()

  _
    .times(index => alreadyConnectedPlayers[index], MAX_PLAYERS_ALLOWED)
    .forEach((player, index) => {
      if (player) {
        createPlayerEntity(player, index, { newPlayer: false })
      }
      createOutline(index)
    })
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
    zIndex:  Layer.BACKGROUND + 10,
  })
  sprite.scale.set(3)
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
      id: `square-${color}`,
      x,
      y,
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
