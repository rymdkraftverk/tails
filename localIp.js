const os = require('os')
const ifaces = os.networkInterfaces()
const R = require('ramda')

const getLocalIp = R.pipe(
  R.toPairs,
  R.chain(R.last),
  R.find(
    R.both(
      R.propEq('family', 'IPv4'),
      R.propEq('internal', false)
    )
  ),
  R.prop('address')
)

console.log(
  getLocalIp(ifaces)
)
