const CONTROLLER_PORT = '4001'

const deployedURLs = {
  'game.rymdkraftverk.com': 'rymdkraftverk.com',
}

export default () => {
  const {
    location: {
      hostname,
      port,
    },
  } = window

  return port ? `${hostname}:${CONTROLLER_PORT}` : deployedURLs[hostname]
}
