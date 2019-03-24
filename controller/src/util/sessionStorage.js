export const getLastGameCode = () => {
  const gameCode = sessionStorage.getItem('gameCode')
  return gameCode || ''
}

export const setLastGameCode = gameCode => {
  sessionStorage.setItem('gameCode', gameCode)
  return gameCode
}
