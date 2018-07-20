import { Entity, Sound, Util } from 'l1'
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

const getPlayerPosition = Util.grid(400, 100, 200, 100, 2)

export function createLobby(gameCode, alreadyConnectedPlayers = []) {
  Entity.getAll()
    .filter(e => e.id !== 'background')
    .forEach(Entity.destroy)

  createLobbyTitle()
  createGameCodeLabel()
  createGameCodeText(gameCode)
  createControllerURLLabel()
  createControllerURLText(getControllerUrl())
  createFirstToWins()
  alreadyConnectedPlayers
    .forEach(((player, index) => { createPlayerEntity(player, index, { newPlayer: false }) }))
}

function createFirstToWins() {
  const e = Entity.get('firstToWins')
  if (e) {
    Entity.destroy(e)
  }

  const { players } = gameState
  const numOfPlayers = playerCount(players)
  if (numOfPlayers < 2) {
    return
  }

  const score = scoreToWin(players)
  const entity = Entity.create('firstToWins')
  const sprite = Entity.addText(entity, `First to ${score} wins!`, { ...small, fill: 'white' })
  sprite.x = 860
  sprite.y = 20
}

function createLobbyTitle() {
  const text = Entity.create('lobbyText')
  const sprite = Entity.addText(text, 'LOBBY', { ...big, fill: 'white', fontSize: 48 * getRatio() })
  sprite.scale.set(1 / getRatio())

  text.originalSize = 48
  sprite.x = 50
  sprite.y = 40
}

function createGameCodeLabel() {
  const text = Entity.create('gameCodeLabel')
  const sprite = Entity.addText(text, 'Code:', { ...small, fontSize: small.fontSize * getRatio(), fill: 'white' })
  sprite.scale.set(1 / getRatio())

  text.originalSize = small.fontSize
  sprite.x = 50
  sprite.y = 360
}

function createGameCodeText(gameCode) {
  const text = Entity.create('gameCodeText')
  const sprite = Entity.addText(text, gameCode, { ...code, fontSize: code.fontSize * getRatio() })
  sprite.scale.set(1 / getRatio())

  text.originalSize = code.fontSize
  sprite.x = 50
  sprite.y = 400
}

function createControllerURLLabel() {
  const text = Entity.create('controllerURLLabel')
  const sprite = Entity.addText(text, 'Go to:', { ...small, fill: 'white' })
  sprite.x = 50
  sprite.y = 170
}

function createControllerURLText(controllerURL) {
  const text = Entity.create('controllerURLText')
  const sprite = Entity.addText(text, controllerURL, { ...code, fontSize: 30 })
  sprite.x = 50
  sprite.y = 200
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
  const square = Entity.create(`square-${color}`)
  const sprite = Entity.addSprite(square, `square-${color}`)
  sprite.scale.set(3)

  const { x, y } = getPlayerPosition(playerIndex)
  sprite.x = x
  sprite.y = y
  sprite.anchor.set(0.5)

  const squareScore = Entity.create(`square-score-${color}`)
  const scoreSprite = Entity.addText(squareScore, score, { ...small, fill: 'white' }, { zIndex: 1 })
  scoreSprite.x = x - 13
  scoreSprite.y = y - 13

  if (newPlayer) {
    square.behaviors.animateEntrance = animateEntranceBehaviour()
    const joinSounds = [
      'join1',
      'join2',
      'join3',
    ]
    const joinSound = joinSounds[Util.getRandomInRange(0, 3)]
    const join = Sound.getSound(`./sounds/${joinSound}.wav`, { volume: 0.6 })
    join.play()
    createFirstToWins()
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
