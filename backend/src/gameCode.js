const R = require('ramda')
const _ = require('lodash/fp')
const { URL } = require('url')
const util = require('util')
const redis = require('redis')

const { error, log } = console

const CODE_LENGTH = 4

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// Inspired by, but then mostly ignored:
// https://www.ismp.org/resources/misidentification-alphanumeric-symbols
const blacklistedLetters = [
  'I', // To avoid "Is this uppercase i or lowercase l?!"
  'G', // Sometimes confused with C at at quick glance
]

const validChars = _.difference(alphabet, blacklistedLetters)

const randomizeCode = () => R
  .range(0, CODE_LENGTH)
  .map(() => _.sample(validChars))
  .reduce(R.concat, '')

const promisify = R.curry((client, method) =>
  util
    .promisify(client[method])
    .bind(client))

const logRedisError = R.pipe(
  R.concat('[Redis error] '),
  error,
)

const gameCodeLog = R.pipe(
  R.concat('[Game code] '),
  log,
)

const createUniqueRandomCode = (set, exists) => {
  const candidateCode = randomizeCode()

  return exists(candidateCode)
    .then(doesExist => (
      doesExist
        ? createUniqueRandomCode(set, exists)
        : set(candidateCode, candidateCode)
          .then(() => candidateCode)
          .catch(logRedisError)
    ))
}

const createRedisInterface = () => {
  const { port, hostname } = new URL(process.env.REDIS_PATH)

  const client = redis.createClient(port, hostname)
  client.on('error', logRedisError)

  const p = promisify(client)

  // Fully apply function but defer execution
  const create = createUniqueRandomCode.bind(
    null,
    p('set'),
    p('exists'),
  )

  gameCodeLog('Powered by redis')
  return {
    create,
    delete: p('del'),
  }
}

const createInMemoryInterface = () => {
  gameCodeLog('Resorting to in memory-tracking. Uniqueness is not guaranteed')
  return {
    create: () => Promise.resolve(randomizeCode()),
    delete: () => Promise.resolve('N/A'),
  }
}

const createEnvInterface = () => {
  const code = process.env.GAME_CODE.toUpperCase()
  gameCodeLog(`Game code overriden for demo purposes: "${code}"`)
  return {
    create: () => Promise.resolve(code),
    delete: () => Promise.resolve('N/A'),
  }
}

const getInterface = () => {
  if (process.env.GAME_CODE) return createEnvInterface()
  if (process.env.REDIS_PATH) return createRedisInterface()
  return createInMemoryInterface()
}

module.exports = getInterface()
