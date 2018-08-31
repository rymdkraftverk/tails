const Influx = require('influx')
const {
  Event:{
    Rtc: {
      ROUND_STARTED,
      PLAYER_MOVEMENT,
      PLAYER_JOINED,
      ROUND_END,
    },
  },
} = require('common')

const { log } = console

const LATENCY_TIME_OFFSET_ERROR = -10
const LATENCY_MISSING_MOVEMENT_ERROR = -20

let movements = {}

const saveToDb = (host, datapoints) => {
  const influx = new Influx.InfluxDB({
    host,
    database: 'novelty',
    schema:   [
      {
        measurement: 'game',
        fields:      {
          latency: Influx.FieldType.INTEGER,
        },
        tags: [
          'color',
        ],
      },
    ],
  })
}

const clearMovements = () => {
  movements = Object
    .keys(movements)
    .reduce((acc, playerId) => {
      acc[playerId] = { ...acc[playerId] }
      return acc
    }, {})
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
  movements[playerId] = movements[playerId].concat(createMovement(playerId, message))
}

const sortOrderingAsc = ({ ordering: ord1 }, { ordering: ord2 }) => ord1 - ord2

const calculcateLatency = ({ controllerTimestamp, gameTimestamp }) => {
  if (controllerTimestamp > gameTimestamp) {
    return LATENCY_TIME_OFFSET_ERROR
  }
  return gameTimestamp - controllerTimestamp
}

const movementWithLatency = movement => ({
  ...movement,
  latency: calculcateLatency(movement),
})

const createLostMovement = (playerId, ordering) => ({
  latency: LATENCY_MISSING_MOVEMENT_ERROR,
  ordering,
})

const createLostMovementRange = (from, to) => {

}

const saveMovements = () => {
  movements
    .sort(sortOrderingAsc)
    .map(movementWithLatency)

    /*
    .reduce((moves, move) => {
      if (moves.length === 0) {

      }
    })
    */
  log('movements:', movements)
  /*
  sort by ordering
  calculcate latency, if weird timestamp, set latency to -10
  fill in missing commands based on ordering with -20 values
  */
}

const registerPlayerJoined = ({ playerId, color }) => {
  log('[METRICS] player joined -', playerId)
  movementWithLatency[playerId] = { color, movements: [] }
}

module.exports = (gameEvents) => {
  gameEvents.on(ROUND_STARTED, clearMovements)
  gameEvents.on(ROUND_END, saveMovements)
  gameEvents.on(PLAYER_MOVEMENT, registerMovement)
  gameEvents.on(PLAYER_JOINED, registerPlayerJoined)
}
