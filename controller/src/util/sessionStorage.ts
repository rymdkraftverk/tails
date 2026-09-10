export const getLastGameCode = () => {
  const gameCode = sessionStorage.getItem('gameCode')
  return gameCode || ''
}

export const setLastGameCode = (gameCode: string) => {
  sessionStorage.setItem('gameCode', gameCode)
  return gameCode
}
