const { URL } = require('url')
const util = require('util')

const redis = require('redis')

const connectClient = (port, hostname) => {
  const client = redis.createClient(port, hostname)
  client.on('error', err => console.log(`Error ${err}`)) // eslint-disable-line no-console

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
  const potentialId = Math
    .random()
    .toString(36)
    .substring(2, 6)
    .toUpperCase()

  return exists(potentialId)
    .then(doesExist => (doesExist
      ? makeGameCode()
      : set(potentialId, potentialId).then(() => potentialId)))
}

const prepareMakeGameCode = (redisPath) => {
  if (!redisPath) {
    return () => new Promise(res => res(Math.random().toString(36).substring(2, 6).toUpperCase()))
  }

  const url = new URL(redisPath)

  const { set, exists } = connectClient(url.port, url.hostname)

  return () => makeGameCode(set, exists)
}

const prepareDeleteGameCode = (redisPath) => {
  if (!redisPath) {
    return () => new Promise(res => res())
  }

  const url = new URL(redisPath)

  const { del } = connectClient(url.port, url.hostname)
  return del
}

module.exports = { prepareMakeGameCode, prepareDeleteGameCode }
