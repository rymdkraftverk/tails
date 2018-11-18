const HTTP_ADDRESS = process.env.HTTP_ADDRESS || 'http://localhost:3000'

const createGame = () =>
  fetch(
    `${HTTP_ADDRESS}/game`,
    {
      method: 'POST',
    },
  )
    .then(res => res.json())

export default { createGame }
