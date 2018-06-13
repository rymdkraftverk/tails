const Influx = require('influx')

const { log } = console

const calculateLatency = ({ timestamp: gT }, { timestamp: pT }) => gT - pT

const convertCommandToNumber = (command) => {
  const number = { left: -1, right: 1 }[command]
  return number !== undefined ? number : 0
}

const mapPlayerAndGameCommand = (playerCommand, gameCommand) => ({
  gameCommand,
  playerCommand,
  metrics: gameCommand
    ? { latency: calculateLatency(gameCommand, playerCommand) }
    : { latency: -1 },
})

const orderingEqual = ({ ordering: o1 }) => ({ ordering: o2 }) => o1 === o2

const zipControllerAndGameCommands = (playerCommands, gameCommands) =>
  playerCommands.map((playerCommand) => {
    const gameCommand = gameCommands.find(orderingEqual(playerCommand))
    return mapPlayerAndGameCommand(playerCommand, gameCommand)
  })

const mapZippedCommandToMetric = (gameCode, playerId, color) => m => ({
  measurement: 'game',
  fields:      {
    latency: m.metrics.latency,
    command: convertCommandToNumber(m.playerCommand.command),
  },
  tags: {
    playerId,
    gameCode,
    color,
  },
  timestamp: m.playerCommand.timestamp,
})


const sortByOrderingAsc = ({ ordering: ord1 }, { ordering: ord2 }) => ord1 - ord2

const save = (datapoints) => {
  const influx = new Influx.InfluxDB({
    host:     'localhost',
    database: 'novelty',
    schema:   [
      {
        measurement: 'game',
        fields:      {
          latency: Influx.FieldType.INTEGER,
          command: Influx.FieldType.INTEGER,
        },
        tags: [
          'playerId',
          'gameCode',
          'color',
        ],
      },
    ],
  })

  const metrics = datapoints.map(d => ({
    measurement: 'game',
    ...d,
  }))

  influx.writePoints(metrics, { precision: 'ms' })
    .then(() => log(`saved ${metrics.length} to db`))
    .catch(err => log(`failed to save metrics to db: ${err}`))
}

module.exports = (gameCode, playerId, color, playerCommands, gameCommands) => {
  const zippedMoves = zipControllerAndGameCommands(
    /* eslint-disable-next-line fp/no-mutating-methods */
    [...playerCommands].sort(sortByOrderingAsc),
    /* eslint-disable-next-line fp/no-mutating-methods */
    [...gameCommands].sort(sortByOrderingAsc),
  )
  const metrics = zippedMoves.map(mapZippedCommandToMetric(gameCode, playerId, color))
  save(metrics)
}
