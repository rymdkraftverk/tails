import * as l2 from 'l2'

export default () => {
  const div = document.createElement('div')
  div.style.color = 'red'
  div.style.position = 'absolute'
  div.style.top = '0px'
  div.style.zIndex = '10'
  document.body.appendChild(div)

  setInterval(() => {
    div.innerHTML = `b: ${l2.getAllBehaviors().length}`
  }, 1000)
}
