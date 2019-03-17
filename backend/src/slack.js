const fetch = require('node-fetch')

const url = process.env.SLACK_WEBHOOK_URL

const { log } = console

const postScoreBoard = (scoreBoard) => {
  if (!url) {
    log('SLACK_WEBHOOK_URL not configured')
    return Promise.resolve()
  }

  const body = JSON.stringify({
    username: 'Score board monitor',
    // Nested stringification to receive the string representation in slack
    text:     JSON.stringify(scoreBoard),
  })

  return fetch(
    url,
    {
      method:  'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
    },
  )
}

module.exports = {
  postScoreBoard,
}
