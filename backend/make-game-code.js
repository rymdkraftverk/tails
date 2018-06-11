const R = require('ramda')
const { URL } = require('url')
const util = require('util')

const redis = require('redis')

const connectClient = (port, hostname) => {
  const client = redis.createClient(port, hostname)
  client.on('error', err => console.error(`Error ${err}`)) // eslint-disable-line no-console

  const set = util.promisify(client.set).bind(client)
  const exists = util.promisify(client.exists).bind(client)
  const del = util.promisify(client.del).bind(client)

  return {
    set,
    exists,
    del,
  }
}

const randomizeCode = () => {
  const forbiddenChars = [
    '0',
    'O',
  ]

  const candidateCode = Math
    .random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()

  const invalidCode = forbiddenChars
    .map(str => candidateCode.indexOf(str) !== -1)
    .reduce(R.or, false)

  return invalidCode
    ? randomizeCode()
    : candidateCode
}

const makeGameCode = (set, exists) => {
  const candidateCode = randomizeCode()

  return exists(candidateCode)
    .then(doesExist => (doesExist
      ? makeGameCode(set, exists)
      : set(candidateCode, candidateCode).then(() => candidateCode)))
}

const connectToRedis = (redisPath) => {
  if (!redisPath) {
    return {
      createGameCode: () => Promise.resolve(randomizeCode()),
      deleteGameCode: Promise.resolve,
    }
  }

  const { port, hostname } = new URL(redisPath)
  const { set, exists, del } = connectClient(port, hostname)

  return {
    createGameCode: () => makeGameCode(set, exists),
    deleteGameCode: del,
  }
}

module.exports = connectToRedis
