const app = require('http').createServer()
const io = require('socket.io')(app)

const parseArgs = require('./parse-args')
const { prepareMakeGameCode, prepareDeleteGameCode } = require('./make-game-code')

const args = parseArgs(process.argv)

const makeGameCode = prepareMakeGameCode(args.redis)
const deleteGameCode = prepareDeleteGameCode(args.redis)
const pruneGameCode = g => g.toUpperCase()

const PORT = 3000

const TYPE = {
  GAME: 'game',
}

const EVENT = {
  CREATE:               'game.create',
  CREATED:              'game.created',
  ANSWER:               'game.join.answer',
  OFFER:                'game.join.offer',
  CONTROLLER_CANDIDATE: 'game.join.controller.candidate',
  GAME_CANDIDATE:       'game.join.game.candidate',
}

const { log } = console

// Stateful
const getClients = () => Object.values(io.clients().connected)
const getClient = id => getClients().find(x => x.id === id)
const getGameClient = gameCode =>
  getClients().find(x =>
    x.type === TYPE.GAME &&
    x.gameCode === gameCode)

io.on('connection', (socket) => {
  socket.on(EVENT.ANSWER, ({ controllerId, answer }) => {
    const controller = getClient(controllerId)
    if (!controller) {
      return
    }
    controller.emit(EVENT.ANSWER, { answer })
  })

  socket.on(EVENT.CREATE, () =>
    makeGameCode()
      .then((gameCode) => {
        /* eslint-disable */
        socket.type = TYPE.GAME
        socket.gameCode = gameCode
        /* eslint-enable */

        socket.emit(EVENT.CREATED, { gameCode })

        socket.on('disconnect', () => deleteGameCode(gameCode))

        log(`Game created: ${gameCode}`)
      }))

  socket.on(EVENT.OFFER, ({ gameCode, offer }) => {
    const game = getGameClient(pruneGameCode(gameCode))
    if (!game) {
      return
    }
    game.emit(EVENT.OFFER, { offer, controllerId: socket.id })
  })

  socket.on(EVENT.CONTROLLER_CANDIDATE, ({ gameCode, candidate }) => {
    const game = getGameClient(pruneGameCode(gameCode))
    if (!game) {
      return
    }
    game.emit(EVENT.CONTROLLER_CANDIDATE, { candidate, controllerId: socket.id })
  })

  socket.on(EVENT.GAME_CANDIDATE, ({ controllerId, candidate }) => {
    const controller = getClient(controllerId)
    if (!controller) {
      return
    }
    controller.emit(EVENT.GAME_CANDIDATE, { candidate })
  })
})

app.listen(PORT, () => log(`listening on port ${PORT}`))
