const R = require('ramda')
const { sample } = require('lodash/fp')
const { URL } = require('url')
const util = require('util')

const redis = require('redis')

const x = require('./x')

const CODE_LENGTH = 4

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

// Inspired by, but then mostly ignored:
// https://www.ismp.org/resources/misidentification-alphanumeric-symbols
const blacklistedLetters = [
  'I', // To avoid "Is this uppercase i or lowercase l?!"
  'G', // Sometimes confused with C at at quick glance
]

const validChars = x.except(alphabet, blacklistedLetters)

const connectClient = (port, hostname) => {
  const client = redis.createClient(port, hostname)
  client.on('error', err => console.error(`Error ${err}`)) // eslint-disable-line no-console

  const set = util
    .promisify(client.set)
    .bind(client)
  const exists = util
    .promisify(client.exists)
    .bind(client)
  const del = util
    .promisify(client.del)
    .bind(client)

  return {
    set,
    exists,
    del,
  }
}

const randomizeCode = () => R
  .range(0, CODE_LENGTH)
  .map(() => sample(validChars))
  .reduce(R.concat, '')

const makeGameCode = (set, exists) => {
  const candidateCode = randomizeCode()

  return exists(candidateCode)
    .then(doesExist => (doesExist
      ? makeGameCode(set, exists)
      : set(candidateCode, candidateCode)
        .then(() => candidateCode)))
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
