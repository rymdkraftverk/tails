const os = require('os')
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

const logLocalIp = R.pipe(
  R.invoker(0, 'networkInterfaces'),
  getLocalIp,
  console.log
)

logLocalIp(os)
