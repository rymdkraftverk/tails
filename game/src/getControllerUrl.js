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

  const controllerUrl = process.env.CONTROLLER_URL
  if (controllerUrl) {
    return controllerUrl
  }

  return port ? `${hostname}:${CONTROLLER_PORT}` : deployedURLs[hostname]
}
