import * as l1 from 'l1'

export default () => {
  const div = document.createElement('div')
  div.style.color = 'red'
  div.style.position = 'absolute'
  div.style.top = '0px'
  div.style.zIndex = 10
  document.body.appendChild(div)

  setInterval(() => {
    div.innerHTML = `b: ${l1.getAllBehaviors().length}`
  }, 1000)
}
