const Influx = require('influx')

const { log } = console

module.exports = (datapoints) => {
  const influx = new Influx.InfluxDB({
    host:     '192.168.1.157',
    database: 'novelty',
    schema:   [
      {
        measurement: 'game',
        fields:      {
          ordering: Influx.FieldType.INTEGER,
        },
        tags: [
          'clientId',
          'gameCode',
          'gameClientType',
          'command',
        ],
      },
    ],
  })

  const metrics = datapoints.map(d => ({
    measurement: 'game',
    ...d,
  }))

  influx.writePoints(metrics).catch(err => log(`failed to write to db: ${err}`))
}
