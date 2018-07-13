import { Entity, Sound, Util, Sprite, Text } from 'l1'
import { COLORS } from 'common'
import { getRatio, playerCount, gameState } from '.'
import { code, big, small } from './util/textStyles'
import { createParabola } from './magic'

const CONTROLLER_PORT = '4001'

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

export function transitionToLobby(gameCode, alreadyConnectedPlayers = []) {
  Entity.getAll()
    .filter(e => e.id !== 'background')
    .forEach(Entity.destroy)

  createText({
    x:     50,
    y:     40,
    text:  'LOBBY',
    style: { ...big, fill: 'white', fontSize: 48 * getRatio() },
    size:  48,
  })

  createText({
    x:     50,
    y:     170,
    text:  'Go to:',
    style: { ...small, fill: 'white', fontSize: small.fontSize * getRatio() },
    size:  small.fontSize,
  })

  createText({
    x:     50,
    y:     200,
    text:  getControllerUrl(),
    style: { ...code, fontSize: 30 * getRatio() },
    size:  30,
  })


  createText({
    x:     50,
    y:     360,
    text:  'Code:',
    style: { ...small, fontSize: small.fontSize * getRatio(), fill: 'white' },
    size:  small.fontSize,
  })

  createText({
    x:     50,
    y:     400,
    text:  gameCode,
    style: { ...code, fontSize: code.fontSize * getRatio() },
    size:  code.fontSize,
  })

  alreadyConnectedPlayers
    .forEach(((player, index) => { createPlayerEntity(player, index, { newPlayer: false }) }))
}


function createText({
  x, y, text, style, size,
}) {
  const textEntity = Entity.addChild(
    Entity.getRoot(),
    {
      x,
      y,
    },
  )

  const textAsset = Text.show(
    textEntity,
    {
      text,
      style,
    },
  )
  textAsset.scale.set(1 / getRatio())

  textEntity.originalSize = size
}

export function addPlayerToLobby(newPlayer) {
  const numOfPlayers = playerCount(gameState.players)
  const color = Object.keys(COLORS)[numOfPlayers]
  const player = {
    ...newPlayer,
    spriteId: `square-${color}`,
    color,
  }

  gameState.players[player.playerId] = player
  createPlayerEntity(player, numOfPlayers, { newPlayer: true })

  return player
}

function createPlayerEntity({ color }, numOfPlayers, { newPlayer }) {
  const square = Entity.addChild(Entity.getRoot(), { id: `square-${color}` })
  const sprite = Sprite.show(square, { texture: `square-${color}` })
  sprite.scale.set(3)
  sprite.x = 400 + (numOfPlayers > 4 ? 200 : 0)
  sprite.y = 100 + ((numOfPlayers % 5) * 100)
  sprite.anchor.set(0.5)
  if (newPlayer) {
    square.behaviors.animateEntrance = animateEntranceBehaviour()
    const joinSounds = [
      'join1',
      'join2',
      'join3',
    ]
    const joinSound = joinSounds[Util.getRandomInRange(0, 3)]
    Sound.play(square, { src: `./sounds/${joinSound}.wav`, volume: 0.6 })
  }
}

const animateEntranceBehaviour = () => ({
  init: (b, e) => {
    b.tick = 0
    b.animation = createParabola(0, 20, -1 * e.sprite.scale.x, 0.08)
  },
  run: (b, e) => {
    b.tick += 1
    e.sprite.scale.set(-1 * b.animation(b.tick))
    if (b.tick >= 20) {
      // eslint-disable-next-line fp/no-delete
      delete e.behaviors.animateEntrance
    }
  },
})
