export default (ordering, command) => ({
  command,
  ordering,
  timestamp: new Date()
    .getTime(),
})
