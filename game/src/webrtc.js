/*

 Steps to connect

 Info needed:
 - controller id

 Stream of events:
 - offer
 - next ice candidate
 - end of ice candidate

 Broadcast event:
 - answer
 - next ice candidate
 - end of ice candidate
 - data channel

*/

const configuration = {
  iceServers: [
    {
      urls: 'stun:stun.l.google.com:19302',
    },
  ],
}


module.exports = gameCode => ({
  clients: () => {},
  send:    () => {},
})
