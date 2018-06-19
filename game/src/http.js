let httpAddress

const createGame = () =>
  fetch(
    `${httpAddress}/game`,
    {
      method: 'POST',
    },
  ).then(res => res.json())

const init = (address) => {
  httpAddress = address

  return {
    createGame,
  }
}

module.exports = init
