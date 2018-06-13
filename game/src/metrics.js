const Influx = require('influx')

const { log } = console

const calculateLatency = ({ timestamp: gT }, { timestamp: pT }) => gT - pT

const convertCommandToNumber = (command) => {
  const number = { left: -1, right: 1 }[command]
  return number !== undefined ? number : 0
}

const mapControllerAndGameCommand = (controllerCommand, gameCommand) => ({
  gameCommand,
  controllerCommand,
  metrics: gameCommand
    ? { latency: calculateLatency(gameCommand, controllerCommand) }
    : { latency: -1 },
})

const orderingEqual = ({ ordering: o1 }) => ({ ordering: o2 }) => o1 === o2

const zipControllerAndGameCommands = (controllerCommands, gameCommands) =>
  controllerCommands.map((controllerCommand) => {
    const gameCommand = gameCommands.find(orderingEqual(controllerCommand))
    return mapControllerAndGameCommand(controllerCommand, gameCommand)
  })

const mapZippedCommandToMetric = (gameCode, controllerId, color) => m => ({
  measurement: 'game',
  fields:      {
    latency: m.metrics.latency,
    command: convertCommandToNumber(m.controllerCommand.command),
  },
  tags: {
    controllerId,
    gameCode,
    color,
  },
  timestamp: m.controllerCommand.timestamp,
})


const sortByOrderingAsc = ({ ordering: ord1 }, { ordering: ord2 }) => ord1 - ord2

const save = (host, datapoints) => {
  const influx = new Influx.InfluxDB({
    host,
    database: 'novelty',
    schema:   [
      {
        measurement: 'game',
        fields:      {
          latency: Influx.FieldType.INTEGER,
          command: Influx.FieldType.INTEGER,
        },
        tags: [
          'controllerId',
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

module.exports = host => (gameCode, controllerId, color, controllerCommands, gameCommands) => {
  const zippedMoves = zipControllerAndGameCommands(
    /* eslint-disable-next-line fp/no-mutating-methods */
    [...controllerCommands].sort(sortByOrderingAsc),
    /* eslint-disable-next-line fp/no-mutating-methods */
    [...gameCommands].sort(sortByOrderingAsc),
  )
  const metrics = zippedMoves.map(mapZippedCommandToMetric(gameCode, controllerId, color))
  save(host, metrics)
}
