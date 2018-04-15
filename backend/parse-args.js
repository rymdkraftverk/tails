const parseArgs = (argV) => {
  if (argV.length === 0) {
    return {}
  }

  const head = argV[0]
  if (head === '--redis') {
    return {
      redis: argV[1],
      ...parseArgs(argV.slice(2)),
    }
  }

  return parseArgs(argV.slice(1))
}

module.exports = argV => parseArgs(argV.slice(2))
