const R = require('ramda')
const _ = require('lodash/fp')
const util = require('util')
const redis = require('redis')

const { error, log } = console

const CODE_LENGTH = 4
const MAX_ATTEMPTS = 10

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

const promisify = R.curry((client, method) => R.bind(
  util.promisify(client[method]),
  client,
))

const logRedisError = R.pipe(
  R.concat('[Redis error] '),
  error,
)

const gameCodeLog = R.pipe(
  R.concat('[Game code] '),
  log,
)

const createUniqueRandomCode = (set, exists, attempts) => {
  if (attempts > MAX_ATTEMPTS) {
    return Promise.reject(new Error(`Failed to find a unique code in ${MAX_ATTEMPTS} attempts`))
  }
  const candidateCode = randomizeCode()

  return exists(candidateCode)
    .then(doesExist => (
      doesExist
        ? createUniqueRandomCode(set, exists, attempts + 1)
        : set(candidateCode, candidateCode, 'EX', 86400) // Expire key after 24h to prevent leakage
          .then(() => candidateCode)
          .catch(logRedisError)
    ))
}

const createRedisInterface = () => {
  const client = redis.createClient({
    url: process.env.REDIS_URL,
  })
  client.on('error', logRedisError)

  const p = promisify(client)

  // Fully apply function but defer execution
  const create = R.partial(
    createUniqueRandomCode,
    [
      p('set'),
      p('exists'),
      0,
    ],
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
  if (process.env.REDIS_URL) return createRedisInterface()
  return createInMemoryInterface()
}

module.exports = getInterface()
