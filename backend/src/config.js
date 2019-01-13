const { env } = process

const parseCsv = x => x.split(',')

const config = {
  corsWhitelist: env.CORS_WHITELIST ? parseCsv(env.CORS_WHITELIST) : [],
}

module.exports = config
