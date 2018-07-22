export const getLastGameCode = () => {
  const gameCode = localStorage.getItem('gameCode')
  return gameCode || ''
}

export const setLastGameCode = (gameCode) => {
  localStorage.setItem('gameCode', gameCode)
  return gameCode
}
