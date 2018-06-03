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

const makeGameCode = (set, exists) => {
  const candidateCode = Math
    .random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()

  return exists(candidateCode)
    .then(doesExist => (doesExist
      ? makeGameCode(set, exists)
      : set(candidateCode, candidateCode).then(() => candidateCode)))
}

const prepareMakeGameCode = () => {
  const redisPath = process.env.REDIS_PATH

  if (!redisPath) {
    return () => Promise.resolve(Math.random().toString(36).substring(2, 6).toUpperCase())
  }

  const { port, hostname } = new URL(redisPath)
  const { set, exists } = connectClient(port, hostname)

  return () => makeGameCode(set, exists)
}

const prepareDeleteGameCode = () => {
  const redisPath = process.env.REDIS_PATH

  if (!redisPath) {
    return () => new Promise(res => res())
  }

  const url = new URL(redisPath)

  const { del } = connectClient(url.port, url.hostname)
  return del
}

module.exports = { prepareMakeGameCode, prepareDeleteGameCode }
