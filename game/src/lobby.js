import { Entity, Sound, Util, Sprite, Text } from 'l1'
import { COLORS } from 'common'
import { getRatio, playerCount, gameState } from '.'
import { code, big, small } from './util/textStyles'
import { createParabola } from './magic'
import { scoreToWin } from './game'

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

const getPlayerPosition = Util.grid({
  x:           400,
  y:           100,
  marginX:     200,
  marginY:     100,
  itemsPerRow: 2,
})

export function transitionToLobby(gameCode, alreadyConnectedPlayers = []) {
  Entity.getAll()
    .filter(e => e.id !== 'background')
    .forEach(Entity.destroy)

  createFirstToWins()

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

function createFirstToWins() {
  const e = Entity.get('firstToWins')
  if (e) {
    Entity.destroy(e)
  }

  const { players } = gameState
  const score = scoreToWin(players)
  const numOfPlayers = playerCount(players)
  if (numOfPlayers < 2) {
    return
  }

  const firstToWinsEntity = Entity.addChild(
    Entity.getRoot(),
    {
      id: 'firstToWins',
      x:  860,
      y:  20,
    },
  )

  const textAsset = Text.show(
    firstToWinsEntity,
    {
      text:  `First to ${score} wins!`,
      style: { ...small, fill: 'white' },
    },
  )
  textAsset.scale.set(1 / getRatio())
  firstToWinsEntity.originalSize = small.fontSize
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
    score:    0,
    color,
  }

  gameState.players[player.playerId] = player
  createPlayerEntity(player, numOfPlayers, { newPlayer: true })

  return player
}

function createPlayerEntity({ color, score }, playerIndex, { newPlayer }) {
  const { x, y } = getPlayerPosition(playerIndex)
  const square = Entity.addChild(
    Entity.getRoot(),
    {
      id: `square-${color}`,
      x,
      y,
    },
  )
  const sprite = Sprite.show(square, { texture: `square-${color}` })
  sprite.scale.set(3)
  sprite.anchor.set(0.5)

  const squareScore = Entity.addChild(
    square,
    {
      id: `square-score-${color}`,
      x:  -25,
      y:  -25,
    },
  )

  const squareScoreText = Text.show(
    squareScore,
    {
      text:   score,
      style:  { ...small, fill: 'white' },
      zIndex: 1,
    },
  )

  squareScoreText.scale.set(1 / getRatio())
  squareScoreText.originalSize = small.fontSize

  if (newPlayer) {
    square.behaviors.animateEntrance = animateEntranceBehaviour()
    const joinSounds = [
      'join1',
      'join2',
      'join3',
    ]
    const joinSound = joinSounds[Util.getRandomInRange(0, 3)]
    createFirstToWins()

    const sound = Entity.addChild(square)
    Sound.play(sound, { src: `./sounds/${joinSound}.wav`, volume: 0.6 })
  }
}

const animateEntranceBehaviour = () => ({
  init: (b, e) => {
    b.tick = 0
    b.animation = createParabola(0, 20, -1 * e.asset.scale.x, 0.08)
  },
  run: (b, e) => {
    b.tick += 1
    e.asset.scale.set(-1 * b.animation(b.tick))
    if (b.tick >= 20) {
      // eslint-disable-next-line fp/no-delete
      delete e.behaviors.animateEntrance
    }
  },
})
