const app = require('http').createServer()
const io = require('socket.io')(app)

const PORT = 3000

const TYPE = {
  GAME: 'game',
}

const EVENT = {
  CREATE:    'game.create',
  CREATED:   'game.created',
  ANSWER:    'game.join.answer',
  OFFER:     'game.join.offer',
  CANDIDATE: 'game.join.controller.candidate',
}

const makeGameCode = () => Math.random().toString(36).substring(2, 6)
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
    controller.emit(EVENT.ANSWER, { answer })
  })

  socket.on(EVENT.CREATE, () => {
    const gameCode = makeGameCode()

    /* eslint-disable */
    socket.type = TYPE.GAME
    socket.gameCode = gameCode
    /* eslint-enable */

    socket.emit(EVENT.CREATED, { gameCode })

    log(`Game created: ${gameCode}`)
  })

  socket.on(EVENT.OFFER, ({ gameCode, offer }) => {
    const game = getGameClient(gameCode)
    game.emit(EVENT.OFFER, { offer, controllerId: socket.id })
  })

  socket.on(EVENT.CANDIDATE, ({ gameCode, candidate }) => {
    const game = getGameClient(gameCode)
    game.emit(EVENT.CANDIDATE, { candidate, controllerId: socket.id })
  })
})

app.listen(PORT, () => log(`listening on port ${PORT}`))
