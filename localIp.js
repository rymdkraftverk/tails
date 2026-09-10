import os from 'node:os'

const { address } = Object
  .values(os.networkInterfaces())
  .flat()
  .find(({ family, internal }) => family === 'IPv4' && !internal)

console.log(address)
