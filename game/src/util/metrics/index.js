const Influx = require('influx')

const {
  RTC: {
    ROUND_START,
    PLAYER_MOVEMENT,
    ROUND_END,
  },
} = require('common')

let movements = []

const clearMovements = () => {
  movements = []
}

const createMovement = (
  playerId,
  {
    payload: {
      command,
      ordering,
      timestamp: controllerTimestamp,
    },
  },
) => {
  const gameTimestamp = new Date()
    .getTime()
  const movement = {
    playerId,
    command,
    ordering,
    controllerTimestamp,
    gameTimestamp,
  }

  return movement
}

const registerMovement = (playerId, message) => {
  const movement = createMovement(playerId, message)
  movements = movements.concat(movement)
}

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

const saveMovements = () => {

}

const movementLatency = (playerId, message) => {
  const { event } = message
  const eventHandlers = {
    [ROUND_START]:     clearMovements,
    [PLAYER_MOVEMENT]: registerMovement,
    [ROUND_END]:       () => {},
  }(eventHandlers[event] || (() => {}))(playerId, message)
  return message
}

module.exports = {
  movementLatency,
}
